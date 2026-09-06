---
layout: publication
title: "Pixelwise Split Conformal Prediction for Global Temperature Emulation via Leave-One-Out Ensemble Distillation"
permalink: /publications/pixelwise-split-conformal-temperature-emulation/
publication_id: pixelwise-split-conformal-temperature-emulation
description: "Pixelwise split conformal calibration becomes a spatial training prior for ensemble distillation in global temperature emulation."
paper_url: /assets/pdf/publications/pixelwise-split-conformal-temperature-emulation.pdf
code_url: https://github.com/bunyaminkorkut/COPA-Global-Temperature-Emulation
---

{% include publication-figure.liquid
  src="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/pipeline.png"
  href="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/pipeline.png"
  alt="Pipeline overview with nine CMIP6 models, leave-one-out teachers, pixelwise split conformal calibration, conformal center weighting, and student distillation"
  caption="Figure 1. The four-stage pipeline: leave-one-out teachers, pixelwise split conformal calibration, calibration-informed teacher weighting, and a distilled student."
  credit="From the paper"
%}

<p class="publication-summary__lede">
Climate emulators are attractive because they can reproduce global temperature fields far more cheaply than physics-based Earth System Models, but a point prediction alone does not say where the emulator is trustworthy. This work uses split conformal prediction twice: first in the familiar role of producing spatial uncertainty intervals, and then in a less conventional role, turning calibration residuals into a <strong>training-time spatial prior</strong> for knowledge distillation.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Climate ensemble</span><strong>9 CMIP6 ESMs</strong></div>
  <div class="publication-summary__fact"><span>Spatial grid</span><strong>192 × 288</strong></div>
  <div class="publication-summary__fact"><span>Input</span><strong>10 channels</strong></div>
  <div class="publication-summary__fact"><span>Teachers</span><strong>9 LOO UNet++ models</strong></div>
  <div class="publication-summary__fact"><span>Nominal coverage</span><strong>90%</strong></div>
  <div class="publication-summary__fact"><span>Student test MAE</span><strong>0.9625 K</strong></div>
</div>

## From an uncertainty wrapper to a training signal

Split conformal prediction is usually added after a predictor has already been trained. Given calibration residuals, it estimates how wide a prediction interval needs to be to attain a target marginal coverage level under exchangeability. The central idea here is to keep that uncertainty interpretation, but also ask a second question: **what can the spatial pattern of calibration errors teach the next model during training?**

The method therefore builds a leakage-controlled teacher ensemble, calibrates every teacher pixel by pixel, and converts the resulting residual statistics into two spatial signals:

1. **teacher-center weights**, which determine how strongly each bias-corrected teacher should contribute to the distillation target at each location; and
2. **pixel-loss weights**, which push the student harder on historically difficult regions.

This turns calibration from a final reporting step into part of the learning process.

## Data and emulator setup

The experiments use monthly near-surface air temperature (`tas`) from nine CMIP6 Earth System Models spanning 1850–2014. Every field is interpolated to a common **192 × 288 latitude–longitude grid**.

For a target month, the input contains one lagged-temperature channel from each of the nine ESMs, built from the fixed lag structure around $t-1$, $t-12$, $t-24$, and $t-36$, plus one static Digital Elevation Model channel. The model therefore receives a tensor of size

$$
10 \times 192 \times 288
$$

and predicts one global $192\times288$ temperature field. All teachers, the baseline, and the final student use the same UNet++ architecture with circular padding in longitude.

## Stage 1 — Leave-one-out teachers

The calibration target for a conformal predictor should not also have been used as target supervision while fitting that predictor. To control that leakage, the method trains one teacher $f_i$ for every ESM $e_i$.

Teacher $f_i$ is supervised only by the other eight target ESMs,

$$
\mathcal{E}\setminus\{e_i\},
$$

and is then calibrated exclusively on the excluded target member $e_i$. All nine ESM channels can still appear as lagged input covariates; the leave-one-out rule applies to the **target supervision**, not to the input tensor.

This construction does not make the climate series perfectly exchangeable—temporal autocorrelation and inter-model distribution shift remain—but it removes the direct training/calibration target leakage that would otherwise make the conformal interpretation especially problematic.

## Stage 2 — Pixelwise split conformal calibration

For each teacher and each grid cell $(h,w)$, absolute residuals on the held-out calibration target define the nonconformity score

$$
s_i(t,h,w)=\left|f_i(x_t)_{h,w}-y_t(h,w)\right|.
$$

At miscoverage level $\alpha=0.10$, a separate conformal quantile map is computed for each teacher:

$$
Q_i(h,w)=
\operatorname{Quantile}_{q_{\mathrm{level}}}
\left(\{s_i(t,h,w)\}_{t=1}^{n_{\mathrm{cal}}}\right).
$$

The corresponding teacher interval at a pixel is

$$
C_i(x;h,w)=
\left[
 f_i(x)_{h,w}-Q_i(h,w),\;
 f_i(x)_{h,w}+Q_i(h,w)
\right].
$$

Under exchangeability, this is a **per-pixel, per-teacher marginal** coverage statement. It is deliberately not presented as joint coverage of the complete global field or as conditional coverage at a fixed climate state.

{% include publication-figure.liquid
  src="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/conformal-maps.png"
  href="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/conformal-maps.png"
  alt="Global maps of weighted lower and upper conformal interval endpoints, interval width, and empirical coverage"
  caption="Figure 2. Pixelwise conformal diagnostics. Wider intervals concentrate in spatially difficult regions, especially high latitudes and complex terrain."
  credit="From the paper"
%}

The interval maps reveal a strong geography of error. High-latitude regions, sea-ice margins, the Southern Ocean, and complex orography require larger residual quantiles than comparatively easier tropical-ocean regions.

## Stage 3 — Calibration-informed teacher weighting

The nine teachers can disagree strongly at the same pixel. First, each teacher receives a spatial bias correction estimated on its calibration target:

$$
\delta_i(h,w)=\frac{1}{n_{\mathrm{cal}}}
\sum_{t=1}^{n_{\mathrm{cal}}}
\left(y_t(h,w)-f_i(x_t)_{h,w}\right),
$$

with corrected prediction

$$
\tilde f_i(x)_{h,w}=f_i(x)_{h,w}+\delta_i(h,w).
$$

A bias-corrected consensus $\bar f$ is formed across teachers. The instantaneous teacher weight is then a softmax over distance to that consensus:

$$
w_i^{\mathrm{dyn}}(t,h,w)=
\frac{
\exp\!\left(-\beta\left|\tilde f_i(x_t)_{h,w}-\bar f(x_t)_{h,w}\right|\right)
}{
\sum_j \exp\!\left(-\beta\left|\tilde f_j(x_t)_{h,w}-\bar f(x_t)_{h,w}\right|\right)
},
$$

with $\beta=2.0$. Teachers that depart more strongly from the bias-corrected consensus are therefore down-weighted at that location and time step.

## Stage 4 — Make difficult pixels matter more

Teacher calibration errors also determine how much attention the student gives each spatial location. The pixel-loss map is proportional to the mean teacher calibration MAE and normalized by its global average:

$$
p(h,w)=
\frac{
\frac{1}{9}\sum_{i=1}^{9}\operatorname{MAE}_i(h,w)
}{
\frac{1}{HW}\sum_{h,w}\frac{1}{9}\sum_{i=1}^{9}\operatorname{MAE}_i(h,w)
}.
$$

Pixels that have historically been hard for the teacher ensemble therefore contribute more strongly to the student objective. The final loss combines supervised error and distillation toward the dynamically weighted teacher consensus:

$$
\mathcal{L}=\sum_{h,w}p(h,w)
\left[
\bigl(g(x)_{h,w}-y_{h,w}\bigr)^2
+\lambda
\left(
 g(x)_{h,w}-\sum_i w_i^{\mathrm{dyn}}(t,h,w)\tilde f_i(x)_{h,w}
\right)^2
\right],
$$

with $\lambda=1.0$.

## Global results

The distilled model improves the reproduced UNet++ baseline on both MAE and RMSE. More importantly, the improvement is spatially widespread rather than being driven by a small number of cells.

<div class="publication-table-scroll">
<table class="publication-results-table">
  <thead><tr><th>Model</th><th>MAE (K)</th><th>RMSE (K)</th><th>Improved pixels</th><th>Empirical coverage</th><th>Avg. half-width</th></tr></thead>
  <tbody>
    <tr><td>UNet++ baseline</td><td>0.9782</td><td>1.3048</td><td>—</td><td>—</td><td>—</td></tr>
    <tr><td><strong>Calibration-guided student</strong></td><td><strong>0.9625</strong></td><td><strong>1.2854</strong></td><td><strong>96.4%</strong></td><td><strong>90.6%</strong></td><td>0.7457</td></tr>
  </tbody>
</table>
</div>

The global MAE reduction is **1.61%**. The student improves **96.4% of grid cells**, while the teacher-derived intervals centered on the student reach **90.6% empirical pixelwise coverage**.

{% include publication-figure.liquid
  src="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/spatial-mae.png"
  href="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/spatial-mae.png"
  alt="Spatial MAE maps for the baseline and distilled student, their difference, and per-pixel MAE distributions"
  caption="Figure 6. Spatial MAE comparison. Positive difference values indicate locations where the distilled student improves on the baseline; 96.4% of grid cells improve."
  credit="From the paper"
%}

## Where the gains occur

Every latitudinal band improves. The absolute gains are largest in the polar regions, precisely where calibration residuals are larger and the pixel-loss map places more emphasis.

<div class="publication-table-scroll">
<table class="publication-results-table">
  <thead><tr><th>Region</th><th>Baseline MAE (K)</th><th>Ours (K)</th><th>Δ (K)</th></tr></thead>
  <tbody>
    <tr><td>Arctic (&gt; 70°N)</td><td>1.7957</td><td>1.7657</td><td>−0.0300</td></tr>
    <tr><td>N. Hemisphere (30–70°N)</td><td>0.5083</td><td>0.4981</td><td>−0.0100</td></tr>
    <tr><td>Tropics (30°S–30°N)</td><td>0.2756</td><td>0.2680</td><td>−0.0080</td></tr>
    <tr><td>S. Hemisphere (30–70°S)</td><td>1.0343</td><td>1.0187</td><td>−0.0160</td></tr>
    <tr><td>Antarctica (&lt; 70°S)</td><td>1.8057</td><td>1.7836</td><td>−0.0220</td></tr>
  </tbody>
</table>
</div>

## The final calibration diagnostics

The last two figures of the paper show two complementary views of uncertainty. The first compares the nine leave-one-out teachers on their held-out target members; the second collapses the pixelwise conformal half-widths into a latitude profile.

{% include publication-figure.liquid
  src="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/teacher-calibration.png"
  href="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/teacher-calibration.png"
  alt="Calibration MAE, RMSE, interval width, and empirical coverage for the nine leave-one-out teachers"
  caption="Figure 7. LOO teacher calibration summary: held-out calibration MAE, RMSE, mean conformal half-width, and empirical coverage."
  credit="From the paper"
%}

The different held-out ESMs are not equally easy to emulate. In particular, the teachers calibrated on GISS-E2-1-H and IPSL-CM6A-LR require wider intervals, reflecting larger calibration residuals.

{% include publication-figure.liquid
  src="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/latitudinal-conformity.png"
  href="/assets/img/publications/pixelwise-split-conformal-temperature-emulation/latitudinal-conformity.png"
  alt="Latitudinal profile of the mean conformal half-width in Kelvin with uncertainty across longitudes"
  caption="Figure 8. Zonal mean conformal half-width in Kelvin. Polar regions require substantially wider intervals than the tropics."
  credit="From the paper"
%}

The geographic pattern is stark: mean conformal half-width is roughly **4.0–4.2 K** in Arctic and Antarctic regions, versus about **0.9 K** in the tropics. The uncertainty map is therefore not only a statistical object; it encodes where the climate-emulation task itself is hardest.

## What the coverage claim means

The paper is deliberately conservative about guarantees.

- The formal split-conformal statement is **marginal**, **per pixel**, and **per teacher**, under exchangeability of calibration and test scores at that pixel.
- It does **not** establish simultaneous joint coverage of all $192\times288$ pixels.
- It does **not** establish conditional coverage at a fixed climate state.
- Monthly climate fields are temporally dependent, so exchangeability is only approximate in this application.
- The final student is trained using post-calibration teacher statistics. Its reported **90.6% coverage is therefore an empirical calibration check**, not a formal conformal theorem for the deployed student.

A direct calibration set held out specifically for the final student would be the clean route to recovering a formal split-conformal guarantee for that predictor.

## Takeaway

The key result is broader than a small reduction in global MAE. Pixelwise conformal residuals expose a spatial map of model difficulty. Instead of discarding that map after building intervals, the method feeds it back into training: teachers are combined according to calibration-informed behavior, and difficult pixels receive more optimization pressure during distillation.

In short, **uncertainty becomes supervision**. The conformal layer does not merely describe where a climate emulator is uncertain; it helps decide where the student should learn harder.
