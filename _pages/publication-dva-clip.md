---
layout: publication
title: "DVA-CLIP: Zero-Feature Denoising and Vision-Side Attention Adaptation for Anomaly Detection"
permalink: /publications/dva-clip/
publication_id: dva-clip
description: "Vision-side attention adaptation and training-free zero-input feature denoising for generalizable anomaly detection."
paper_url:
code_url: https://github.com/sahinyu/dva-clip
---

{% include publication-figure.liquid
  src="/assets/img/publications/dva-clip/framework.png"
  href="/assets/img/publications/dva-clip/framework.png"
  alt="Overview of the DVA-CLIP framework"
  caption="DVA-CLIP augments an AA-CLIP-style visual pathway with cross-scale attention, a global visual attention adapter, and a training-free zero-input denoising branch."
  credit="Figure 2 from the manuscript"
  wide=true
%}

<p class="publication-summary__lede">
DVA-CLIP asks a simple question: if zero-shot anomaly detection already has strong language-side alignment, can we make the <strong>visual pathway itself</strong> more anomaly-aware? The method keeps the language encoder frozen and concentrates adaptation on the vision side, where sparse, localized, low-contrast, and scale-dependent defects must actually be represented before they can be matched to text.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Backbone</span><strong>CLIP ViT-L/14</strong></div>
  <div class="publication-summary__fact"><span>Input</span><strong>518 × 518</strong></div>
  <div class="publication-summary__fact"><span>Text encoder</span><strong>Frozen</strong></div>
  <div class="publication-summary__fact"><span>Visual adapters</span><strong>Cross-scale + Global</strong></div>
  <div class="publication-summary__fact"><span>Denoising</span><strong>Training-free zero input</strong></div>
  <div class="publication-summary__fact"><span>Evaluation</span><strong>Industrial + medical</strong></div>
</div>

## Why move adaptation to the vision side?

CLIP-based anomaly detectors typically compare visual features against semantic anchors such as **normal object**, **damaged object**, **normal tissue**, or **abnormal tissue**. Strong methods such as AA-CLIP improve this alignment, but the visual encoder still inherits standard ViT attention.

That is a mismatch for anomaly localization. Defects may occupy only a few patches, appear at very different spatial scales, or have weak contrast against normal structure. Standard global attention can therefore produce diffuse responses or false activations around regular edges.

The progression below is Figure 1 from the manuscript. The baseline reacts broadly to normal structure; vision-side adaptation moves the response toward the actual defect; zero-input denoising suppresses the remaining background response.

{% include publication-figure.liquid
  src="/assets/img/publications/dva-clip/attention-progression.png"
  href="/assets/img/publications/dva-clip/attention-progression.png"
  alt="Baseline, vision-side attention, denoised anomaly map, and ground truth"
  caption="From baseline to attention adaptation to denoising on an MVTec-AD zipper example."
  credit="Figure 1 from the manuscript"
%}

## Three complementary components

DVA-CLIP adds three modules to the AA-CLIP-style visual pathway:

1. **Cross-scale attention** exchanges information across selected representation depths so that fine spatial detail and deeper semantic context can interact.
2. **Global visual attention** adds a lightweight self-attention refinement over the visual tokens used for similarity-map computation.
3. **Zero-input feature denoising** estimates input-independent visual artifacts with a zero image and subtracts them from the real features at inference time.

The language encoder is not modified. The method therefore treats the text representation as a stable semantic reference while changing how image evidence reaches that reference.

## Controlled visual adaptation

For a selected transformer block, the adapted representation is blended with the original visual representation:

$$
\hat{X}_i=(1-\alpha)X_i+\alpha\,\bar{A}_i(X_i),
$$

where the adapter output is norm-matched to the original feature:

$$
\bar{A}_i(X_i)
=
A_i(X_i)
\frac{\lVert X_i\rVert_2}
{\lVert A_i(X_i)\rVert_2+\epsilon}.
$$

This makes the adapter primarily change the **direction** of the visual representation while controlling feature magnitude. Small values of $\alpha$ preserve the pretrained CLIP prior; larger values give the vision-side adapter more influence.

## Cross-scale attention

The cross-scale module couples the selected layer pairs

$$
(6,12),\qquad (12,18),\qquad (18,24).
$$

The design deliberately pairs nearby depth ranges rather than the earliest and latest layers. Lower layers contribute fine spatial detail, while deeper layers contribute increasingly semantic context. Cross-attention lets information travel between these representations before anomaly-map construction.

This is particularly relevant when the anomaly itself changes scale: a subtle lesion, a thin structural crack, and a large malformed region should not require the same visual receptive behavior.

## Global visual attention

Cross-scale attention moves information **between representation levels**. The Global Visual adapter instead refines relationships **within one token sequence**.

Given visual features $F\in\mathbb{R}^{N\times C}$,

$$
O =
\mathrm{MHA}
\left(
\mathrm{LayerNorm}(F),
\mathrm{LayerNorm}(F),
\mathrm{LayerNorm}(F)
\right).
$$

The resulting token-to-token refinement is inserted on upper visual representations used for image-text similarity, so the additional attention directly affects the anomaly score rather than only early feature extraction.

## Zero-input feature denoising

The training-free part of DVA-CLIP is based on the observation that ViT encoders can emit non-trivial structure even for an input with no scene content.

A zero image

$$
I_0=\mathbf{0}\in\mathbb{R}^{3\times H\times W}
$$

is passed through the same adapted visual pathway. The resulting reference features capture input-independent components such as positional structure, biases, and other encoder artifacts.

Real patch and image-level features are then denoised by subtracting scaled zero-input references:

$$
\tilde{F}^{p}_l
=
\mathrm{Normalize}
\left(
F^{p}_l-\lambda_p F^{p,0}_l
\right),
$$

$$
\tilde{f}^{d}
=
\mathrm{Normalize}
\left(
f^d-\lambda_d f^{d,0}
\right).
$$

No anomaly labels, extra training stage, or language-side update is required. Setting either denoising scale to zero disables the corresponding subtraction.

## Cross-dataset evaluation

The adapters are evaluated under the AA-CLIP cross-dataset protocol. When a target benchmark is unseen, the model does **not** use target-domain samples for adapter training.

The experiments cover:

- **Industrial:** VisA, MVTec-AD, MPDD
- **Medical:** ColonDB, CVC-300, ClinicDB, Kvasir, Brain MRI, Liver CT, Retina OCT

Evaluation uses AUROC at both the **pixel level** for localization and the **image level** for detection.

### Selected pixel-level results

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Dataset</th><th>AA-CLIP</th><th>DVA-CLIP CS</th><th>DVA-CLIP GV</th></tr>
</thead>
<tbody>
<tr><td>MVTec-AD</td><td>91.90</td><td>91.62</td><td><strong>92.48</strong></td></tr>
<tr><td>MPDD</td><td>96.70</td><td><strong>96.72</strong></td><td>95.88</td></tr>
<tr><td>ColonDB</td><td>84.00</td><td>84.23</td><td><strong>85.08</strong></td></tr>
<tr><td>CVC-300</td><td>96.40</td><td>97.01</td><td><strong>97.49</strong></td></tr>
<tr><td>ClinicDB</td><td>89.90</td><td>89.87</td><td><strong>90.85</strong></td></tr>
<tr><td>Brain MRI</td><td>95.50</td><td><strong>96.76</strong></td><td>95.91</td></tr>
<tr><td>Liver CT</td><td>97.80</td><td><strong>98.59</strong></td><td>97.72</td></tr>
<tr><td>Retina OCT</td><td>95.50</td><td><strong>96.49</strong></td><td>95.08</td></tr>
</tbody>
</table>
</div>

The strongest and most consistent gains appear in challenging medical settings. Cross-scale adaptation reaches **98.59%** pixel AUROC on Liver CT and **96.49%** on Retina OCT, while Global Visual reaches the strongest reported result on MVTec-AD among the compared DVA-CLIP variants.

## What denoising adds

The paper separates the vision-side adapter from zero-input denoising on representative cases where the denoising term produces a positive gain.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Dataset</th><th>Metric</th><th>Adapter</th><th>w/o DN</th><th>w/ DN</th><th>Gain</th></tr>
</thead>
<tbody>
<tr><td>Retina OCT</td><td>Image AUROC</td><td>CS</td><td>86.11</td><td><strong>88.43</strong></td><td>+2.32</td></tr>
<tr><td>Retina OCT</td><td>Image AUROC</td><td>GV</td><td>85.30</td><td><strong>86.23</strong></td><td>+0.93</td></tr>
<tr><td>Liver CT</td><td>Image AUROC</td><td>CS</td><td>74.53</td><td><strong>75.12</strong></td><td>+0.59</td></tr>
<tr><td>Brain MRI</td><td>Image AUROC</td><td>GV</td><td>82.96</td><td><strong>83.16</strong></td><td>+0.20</td></tr>
<tr><td>Retina OCT</td><td>Pixel AUROC</td><td>CS</td><td>95.96</td><td><strong>96.49</strong></td><td>+0.53</td></tr>
<tr><td>Liver CT</td><td>Pixel AUROC</td><td>CS</td><td>98.14</td><td><strong>98.59</strong></td><td>+0.45</td></tr>
<tr><td>Liver CT</td><td>Pixel AUROC</td><td>GV</td><td>97.37</td><td><strong>97.72</strong></td><td>+0.35</td></tr>
</tbody>
</table>
</div>

The key nuance is that denoising is **not universally beneficial**. High-contrast industrial defects are already comparatively robust to these input-independent artifacts. The larger benefit appears in low-contrast medical modalities, where small spurious responses can materially alter anomaly scoring.

## Anomaly size matters

The size-aware analysis shows that the vision-side modules are complementary rather than interchangeable. On Brain MRI, Cross-scale attention improves all three anomaly-size groups over AA-CLIP. On Liver CT, the strongest variant depends on anomaly size: Global Visual is strongest for medium anomalies, while Cross-scale + denoising performs best on large anomalies.

This supports the central design motivation: anomaly representation is inherently scale dependent, and a single fixed attention behavior is unlikely to be optimal across all spatial extents.

## What the maps look like

The manuscript's final qualitative figure compares the AA-CLIP baseline, vision-side adaptation, adaptation plus denoising, and the ground truth across industrial and medical samples.

{% include publication-figure.liquid
  src="/assets/img/publications/dva-clip/qualitative.png"
  href="/assets/img/publications/dva-clip/qualitative.png"
  alt="Qualitative anomaly localization comparisons for Cross-scale and Global Visual attention"
  caption="AA-CLIP, DVA-CLIP, DVA-CLIP + denoising, and ground-truth anomaly masks across MVTec-AD and Brain MRI examples."
  credit="Figure 3 from the manuscript"
  wide=true
%}

The qualitative progression is consistent with the quantitative story: the baseline often activates on surrounding texture or normal structure; vision-side adaptation concentrates the response; denoising removes additional residual structure and sharpens the final anomaly boundaries.

## Takeaway

DVA-CLIP does not replace CLIP's language-side anomaly semantics. It treats those semantics as a stable anchor and asks the visual encoder to provide cleaner, more spatially useful evidence.

The three components attack different failure modes:

- **Cross-scale attention** handles anomalies that change in spatial extent.
- **Global Visual attention** refines long-range token interactions.
- **Zero-input denoising** removes a component of the visual response that can exist independently of the actual image.

Together, they shift generalizable anomaly detection from a primarily prompt/alignment problem toward a more balanced vision-language system in which the **visual representation is explicitly adapted for localization**.
