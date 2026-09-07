---
layout: publication
title: "Lesion Segmentation of Neonatal Diffusion MRI Under Simulated K-space Undersampling"
permalink: /publications/neonatal-mri-kspace-lesion-segmentation/
publication_id: neonatal-mri-kspace-lesion-segmentation
description: "Frequency-aware SwinUNETR variants for neonatal HIE lesion segmentation directly from simulated undersampled diffusion MRI."
---

{% include publication-figure.liquid
  src="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/architecture.png"
  href="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/architecture.png"
  alt="SwinUNETR-based lesion segmentation architecture with Block DCT frequency features"
  caption="The segmentation framework combines ADC/ZADC inputs with SwinUNETR and a localized Block DCT branch for frequency-aware lesion representation."
  credit="Figure 4 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
Neonatal HIE lesions are often tiny, diffuse, and difficult to detect even in fully sampled diffusion MRI. This work asks a more demanding question: <strong>can those lesions still be segmented when acquisition is accelerated by undersampling k-space?</strong> The study simulates realistic low-resolution MRI acquisition, then augments a SwinUNETR segmentation model with global and localized frequency-domain priors based on the Discrete Cosine Transform (DCT).
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Dataset</span><strong>BONBID-HIE</strong></div>
  <div class="publication-summary__fact"><span>Modalities</span><strong>ADC + ZADC</strong></div>
  <div class="publication-summary__fact"><span>Backbone</span><strong>SwinUNETR</strong></div>
  <div class="publication-summary__fact"><span>Acceleration</span><strong>4× / 8×</strong></div>
  <div class="publication-summary__fact"><span>Frequency prior</span><strong>Global + Block DCT</strong></div>
  <div class="publication-summary__fact"><span>Metric</span><strong>Dice</strong></div>
</div>

## Why undersampled neonatal MRI is difficult

MRI scan time is a practical constraint in neonatal care. Shorter acquisition can reduce motion and improve tolerability, but accelerating acquisition by sampling less of k-space introduces aliasing and spatial degradation.

This becomes particularly problematic for Hypoxic Ischemic Encephalopathy (HIE), where lesions are often:

- small,
- diffuse,
- multifocal,
- low contrast,
- and sometimes occupy less than 1% of the brain.

The paper therefore evaluates lesion segmentation <strong>directly on undersampled images</strong>, rather than first reconstructing them into a high-resolution image and then segmenting.

## BONBID-HIE inputs

The study uses the BONBID-HIE dataset, which provides neonatal diffusion MRI and expert lesion annotations.

The key inputs are:

- <strong>ADC</strong>: Apparent Diffusion Coefficient maps;
- <strong>ZADC</strong>: z-score normalized ADC maps;
- <strong>LABEL</strong>: expert binary lesion masks.

{% include publication-figure.liquid
  src="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/bonbid-examples.png"
  href="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/bonbid-examples.png"
  alt="ADC, ZADC, and lesion-label examples from BONBID-HIE"
  caption="Example BONBID-HIE inputs: ADC, ZADC, and expert lesion masks."
  credit="Figure 2 from the paper"
%}

ZADC is especially useful because it measures local deviations from a normative neonatal ADC atlas, helping separate pathology from anatomically normal variation.

## Simulating accelerated MRI acquisition

Undersampling is performed slice-by-slice in k-space.

For each ADC and ZADC slice:

1. the image is converted to a complex-valued representation;
2. a centered 2D FFT is applied;
3. a binary sampling mask removes k-space coefficients;
4. missing frequencies are zero-filled;
5. an inverse FFT reconstructs an aliased image;
6. the magnitude image becomes the segmentation input.

The paper studies:

- 4-fold random undersampling,
- 4-fold equispaced undersampling,
- 8-fold random undersampling,
- 8-fold equispaced undersampling.

{% include publication-figure.liquid
  src="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/undersampling-visualization.png"
  href="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/undersampling-visualization.png"
  alt="Four simulated k-space undersampling settings and corresponding aliased MRI slices"
  caption="Random and equispaced 4×/8× k-space undersampling produce different aliasing patterns while reducing acquired frequency information."
  credit="Figure 3 from the paper"
  wide=true
%}

For 4× undersampling the center fraction is 0.20; for 8× it is 0.10.

## Three segmentation strategies

The experiments compare three progressively frequency-aware SwinUNETR configurations.

### Baseline: ADC + ZADC

The baseline uses only the two spatial input channels:

$$
I_{\mathrm{input}}
=
\operatorname{concat}
\left(
I_{\mathrm{ADC}},
I_{\mathrm{ZADC}}
\right).
$$

This asks SwinUNETR to infer lesion structure entirely from the aliased spatial-domain images.

### Global DCT

The second variant appends a global DCT representation of the ADC volume:

$$
I_{\mathrm{input}}
=
\operatorname{concat}
\left(
I_{\mathrm{ADC}},
I_{\mathrm{ZADC}},
\mathcal{D}(I_{\mathrm{ADC}})
\right).
$$

The transform spans the full \(128\times128\) slice, acting as a global frequency descriptor.

### Localized Block DCT

The third variant embeds a learnable localized frequency branch inside the early encoder.

The local representation is fused with the spatial stream as

$$
x_{\mathrm{input}}
=
\operatorname{concat}
\left(
I_{\mathrm{ADC}},
I_{\mathrm{ZADC}},
F_{\mathrm{DCT}}
\right),
$$

with an early hybrid block:

$$
x_{\mathrm{enc}}
=
\phi
\left(
\mathcal{D}_{\mathrm{local}}(x)
+
\mathrm{Conv3D}(x)
\right).
$$

This preserves regional frequency information instead of collapsing the full slice into one global spectral representation.

## Global frequency vs. local frequency

The difference is visualized directly in the paper:

{% include publication-figure.liquid
  src="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/global-vs-block-dct.png"
  href="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/global-vs-block-dct.png"
  alt="Comparison of Global DCT and Block DCT representations"
  caption="Global DCT summarizes frequency content over the full image, whereas Block DCT preserves localized spectral information across spatial regions."
  credit="Figure 1 from the paper"
  wide=true
%}

This distinction is important for tiny lesions. A small lesion may be weak in the global spectrum but still create a useful local spectral pattern in the affected region.

## Why SwinUNETR?

SwinUNETR combines hierarchical transformer attention with a U-Net-like encoder-decoder and skip connections.

For this problem, that provides two complementary advantages:

- long-range attention can model diffuse anatomical context;
- skip connections preserve the spatial resolution required for very small lesions.

The DCT branch is therefore not a replacement for the spatial model. It provides an additional frequency prior to a strong spatial-transformer backbone.

## Loss and optimization

Because lesion voxels are extremely sparse, the study uses <strong>Focal Tversky Loss</strong> to emphasize difficult positive regions and reduce the effect of severe class imbalance.

Optimization uses AdamW.

All model variants are trained under the same augmentation, loss, optimizer, and learning-rate settings so that the DCT comparison remains controlled.

## Main three-model comparison

The paper reports the following best Dice scores under 4-fold undersampled training:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Model</th><th>Best Dice</th></tr></thead>
<tbody>
<tr><td>Baseline (No DCT)</td><td>0.52</td></tr>
<tr><td>Global DCT (Patch 128)</td><td>0.55</td></tr>
<tr><td><strong>Block DCT (Patch 48)</strong></td><td><strong>0.56</strong></td></tr>
</tbody>
</table>
</div>

The progression is consistent with the paper's main hypothesis:

> frequency information helps, and localized frequency information helps more.

The Global DCT model improves over the purely spatial baseline, while the Block DCT configuration achieves the strongest result in the three-model comparison.

## Patch size and sampling strategy

The paper also reports a more detailed Block-DCT ablation across patch sizes and undersampling patterns.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Mask</th><th>Patch</th><th>4× Dice</th><th>4× Std</th><th>8× Dice</th><th>8× Std</th></tr>
</thead>
<tbody>
<tr><td>Random</td><td>32</td><td>0.5233</td><td>0.0138</td><td>0.4570</td><td>0.0149</td></tr>
<tr><td>Random</td><td>48</td><td>0.4965</td><td>0.0174</td><td>0.4453</td><td>0.0077</td></tr>
<tr><td>Random</td><td>64</td><td>0.4942</td><td>0.0214</td><td>0.4364</td><td>0.0214</td></tr>
<tr><td><strong>Equispaced</strong></td><td><strong>32</strong></td><td><strong>0.5269</strong></td><td><strong>0.0137</strong></td><td><strong>0.4583</strong></td><td><strong>0.0148</strong></td></tr>
<tr><td>Equispaced</td><td>48</td><td>0.5013</td><td>0.0175</td><td>0.4483</td><td>0.0076</td></tr>
<tr><td>Equispaced</td><td>64</td><td>0.4991</td><td>0.0232</td><td>0.4383</td><td>0.0212</td></tr>
</tbody>
</table>
</div>

Within this undersampling/patch-size ablation, the strongest mean is obtained with <strong>patch size 32 + equispaced 4× sampling</strong> at

$$
0.5269 \pm 0.0137.
$$

The results also show the expected degradation when acceleration becomes more aggressive: all 8× settings score below their 4× counterparts.

## What patch size changes qualitatively

The paper visualizes predictions for patch sizes 32, 48, and 64 on two lesion slices.

{% include publication-figure.liquid
  src="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/patch-size-qualitative.png"
  href="/assets/img/publications/neonatal-mri-kspace-lesion-segmentation/patch-size-qualitative.png"
  alt="Ground-truth lesion masks and Block DCT predictions for patch sizes 32, 48, and 64"
  caption="Qualitative Block-DCT predictions at different patch sizes. Local spectral granularity changes lesion shape and boundary recovery."
  credit="Figure 5 from the paper"
  wide=true
%}

The figure reinforces that frequency granularity is not a purely numerical hyperparameter. Smaller and larger blocks capture different spatial-frequency contexts, which directly affects the reconstructed lesion geometry.

## What the experiments say about frequency priors

Two findings should be separated.

First, the <strong>three-model comparison</strong> supports the overall architectural argument:

- no DCT: 0.52
- global DCT: 0.55
- localized Block DCT: 0.56

Second, the <strong>detailed Block-DCT ablation</strong> shows that performance depends strongly on patch scale and sampling pattern, with 32-pixel equispaced patches producing the strongest reported mean within that table.

Together, these results suggest that frequency-domain information is useful, but its spatial granularity matters.

## Limitations

The study evaluates only the publicly available BONBID-HIE training and validation data because the external challenge test set was not accessible during the experiments.

That means the results do not yet establish robustness across:

- other hospitals,
- scanner manufacturers,
- acquisition protocols,
- or external neonatal cohorts.

The paper also notes that simple channel-wise spatial-frequency fusion may leave performance on the table. Attention-based fusion or learned spectral weighting are natural next steps.

## Takeaway

This work treats k-space undersampling not only as an image-reconstruction problem, but as a downstream segmentation problem.

The core result is that neonatal HIE lesions can still be segmented directly from aliased diffusion MRI, and that <strong>frequency-aware priors improve the transformer segmentation backbone</strong>.

The most important design lesson is:

> **When spatial resolution is constrained, the frequency structure discarded by the image view can still carry useful lesion information.**

Global DCT provides that information in aggregate; Block DCT makes it local enough to help recover small lesion structure.
