---
layout: publication
title: "ITACLIP: Boosting Training-Free Semantic Segmentation with Image, Text, and Architectural Enhancements"
permalink: /publications/itaclip/
publication_id: itaclip
description: "Training-free open-vocabulary semantic segmentation through coordinated architectural, image, and text enhancements to CLIP."
---

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/framework.png"
  href="/assets/img/publications/itaclip/framework.png"
  alt="Overview of the ITACLIP image, text, and architectural enhancement framework"
  caption="ITACLIP combines a modified CLIP image encoder, image engineering, and LLM-generated auxiliary texts to improve training-free open-vocabulary semantic segmentation."
  credit="Figure 2 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
CLIP was trained to understand images and text at the <strong>image level</strong>, not to assign a semantic label to every pixel. ITACLIP asks how far that pretrained knowledge can be pushed toward dense prediction <strong>without any segmentation training</strong>. The answer is to improve three parts of the inference pipeline at once: the visual architecture, the image representation, and the text representation.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Backbone</span><strong>CLIP ViT-B/16</strong></div>
  <div class="publication-summary__fact"><span>Training</span><strong>None</strong></div>
  <div class="publication-summary__fact"><span>Benchmarks</span><strong>5</strong></div>
  <div class="publication-summary__fact"><span>Image branch</span><strong>Image Engineering</strong></div>
  <div class="publication-summary__fact"><span>Text branch</span><strong>LLM auxiliary text</strong></div>
  <div class="publication-summary__fact"><span>Architecture</span><strong>Self-self attention</strong></div>
</div>

## From image classification to pixel classification

In a vanilla CLIP segmentation baseline, each image patch is treated as a local visual feature and compared directly with the text embeddings of the target classes.

For patch features \(X^{visual}_{patch}\) and class text embeddings \(X^{text}\), the segmentation map is obtained conceptually as

$$
S
=
\arg\max_{c\in C}
\left(
\operatorname{upsample}
\left(
\cos
\left(
X^{visual}_{patch},
X^{text}
\right)
\right)
\right).
$$

This is attractive because it requires no dense training labels, but the original CLIP image encoder was never optimized for pixel-level localization. ITACLIP therefore modifies the information entering this similarity calculation rather than training a new segmentation model.

## What changes in ITACLIP?

The method attacks the problem from three directions.

### 1. Architectural enhancement

The last part of CLIP's ViT is altered to preserve more spatially useful patch interactions.

### 2. Image enhancement

Instead of representing an image only once, ITACLIP creates complementary augmented views and combines their predictions.

### 3. Text enhancement

Instead of representing a class only by its name, an LLM generates additional semantic descriptions—definitions or synonyms—which are fused with the original CLIP text embedding.

The three branches meet only at inference time, preserving the training-free character of the method.

## Why ordinary CLIP attention is not enough

Original ViT self-attention computes interactions between query and key projections. This works well for global image recognition, but patch localization is not the objective CLIP was trained for.

ITACLIP follows the self-self attention idea and uses a sum of query-query and key-key attention maps in the final visual block:

$$
\operatorname{Attn}(X)
=
\operatorname{softmax}
\left(
\frac{
XW_QW_Q^{T}X^{T}
}{
\sqrt{d}
}
\right)
+
\operatorname{softmax}
\left(
\frac{
XW_KW_K^{T}X^{T}
}{
\sqrt{d}
}
\right).
$$

The effect is dramatic in the ablation:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Attention</th><th>Pascal VOC mIoU</th></tr></thead>
<tbody>
<tr><td>q-k</td><td>19.0</td></tr>
<tr><td>q-q</td><td>58.9</td></tr>
<tr><td>k-k</td><td>52.2</td></tr>
<tr><td>v-v</td><td>57.7</td></tr>
<tr><td><strong>q-q + k-k</strong></td><td><strong>67.9</strong></td></tr>
<tr><td>q-q + v-v</td><td>64.9</td></tr>
<tr><td>q-q + k-k + v-v</td><td>66.4</td></tr>
</tbody>
</table>
</div>

The best combination is therefore not the original CLIP attention but **q-q + k-k**.

## The last FFN is removed

CLIP's final transformer block also contains a feed-forward network optimized during image-level pretraining.

ITACLIP removes that final FFN and uses the residual attention output directly:

$$
X^{(L)}
=
X^{(L-1)}
+
\operatorname{SA}
\left(
\operatorname{LN}
\left(
X^{(L-1)}
\right)
\right).
$$

This small architectural subtraction improves every reported dataset:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Final FFN</th><th>COCO-Stuff</th><th>COCO-Object</th><th>VOC</th><th>Context</th><th>Cityscapes</th></tr>
</thead>
<tbody>
<tr><td>Kept</td><td>26.3</td><td>36.9</td><td>66.3</td><td>36.3</td><td>39.4</td></tr>
<tr><td><strong>Removed</strong></td><td><strong>27.0</strong></td><td><strong>37.7</strong></td><td><strong>67.9</strong></td><td><strong>37.5</strong></td><td><strong>40.2</strong></td></tr>
</tbody>
</table>
</div>

## Middle layers know something the last layer forgets

The attention visualization makes the motivation for multi-layer fusion visible.

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/layer-attention.png"
  href="/assets/img/publications/itaclip/layer-attention.png"
  alt="Attention maps from CLIP ViT-B/16 layers 1, 4, 7, 8, 10, and 12"
  caption="Attention maps for one selected patch. Shallow layers remain highly local; middle and later layers progressively capture semantically related regions."
  credit="Figure 3 from the paper"
%}

Early layers mostly attend near the selected patch. Middle layers begin to recover semantically related regions, while the final layer contains the strongest object-level structure.

ITACLIP therefore combines the final-layer attention with the mean of selected intermediate attention maps:

$$
\operatorname{Attn}_{refined}(X)
=
\frac{
\operatorname{Attn}_{L}(X)
+
\operatorname{mean}
\left(
\operatorname{Attn}_{l'}(X)
\right)
}{
2
}.
$$

The intermediate-layer ablation finds the best tested combination at layers

$$
\{7,8,10\}.
$$

Without intermediate layers, Pascal VOC reaches 65.0 mIoU; with \(\{7,8,10\}\), it reaches 65.6 before PAMR.

## Text Engineering with an LLM

Open-vocabulary segmentation should work for arbitrary class names, which makes manually writing an elaborate prompt for every possible class unattractive.

ITACLIP uses LLaMA 3 to generate either:

- a short **definition**, or
- a **synonym**

for each class.

The generated auxiliary text is encoded by CLIP alongside the original class name.

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/definition-prompt.png"
  href="/assets/img/publications/itaclip/definition-prompt.png"
  alt="Prompt used to generate a short class definition with LLaMA"
  caption="Definition-generation prompt used by the auxiliary-text module."
  credit="Figure 4a from the paper"
%}

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/synonym-prompt.png"
  href="/assets/img/publications/itaclip/synonym-prompt.png"
  alt="Prompt used to generate a class synonym with LLaMA"
  caption="Synonym-generation prompt used by the auxiliary-text module."
  credit="Figure 4b from the paper"
%}

If \(X^{text}\) is the original class embedding and \(X^{text}_{aux}\) the auxiliary embedding, ITACLIP uses

$$
X^{text}_{refined}
=
\alpha X^{text}_{aux}
+
(1-\alpha)X^{text}.
$$

This preserves the original class name while letting the language model supply additional semantic context.

## Image Engineering: the visual analogue of prompt engineering

Prompt engineering gives a text encoder multiple descriptions of the same concept. ITACLIP introduces an analogous idea for the image encoder.

Four augmentations are used:

- Gaussian blur
- grayscale
- horizontal flip
- vertical flip

They are separated into two categories.

### Spatially preserving augmentations

Blur and grayscale do not change pixel positions. Their normalized patch embeddings can therefore be averaged directly with the original image representation:

$$
X^{visual}_{1}
=
\frac{1}{K+1}
\sum_{i=0}^{K}
\frac{
X^{visual,i}_{1}
}{
\left\|X^{visual,i}_{1}\right\|_F
}.
$$

### Spatially changing augmentations

Horizontal and vertical flips change the spatial ordering of patches. ITACLIP therefore predicts on the augmented image, **reverses the augmentation on the logits**, and only then averages the result.

The spatially preserving and spatially restored logits are finally combined:

$$
L
=
\lambda L_1
+
(1-\lambda)L_2.
$$

The idea is simple: if multiple semantically equivalent views agree on a pixel, the dense prediction becomes less dependent on one specific appearance of the image.

## Do the text and image modules matter independently?

Yes.

Without PAMR, the module ablation reports:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>LLM text</th><th>Image Engineering</th><th>Pascal Context</th><th>COCO-Stuff</th></tr></thead>
<tbody>
<tr><td>✗</td><td>✗</td><td>34.3</td><td>24.5</td></tr>
<tr><td>✓</td><td>✗</td><td>34.6</td><td>24.8</td></tr>
<tr><td><strong>✓</strong></td><td><strong>✓</strong></td><td><strong>35.4</strong></td><td><strong>25.4</strong></td></tr>
</tbody>
</table>
</div>

Each enrichment helps, and using both gives the strongest result.

## Main results

ITACLIP is evaluated on five semantic segmentation benchmarks and compared with training-free and weakly supervised methods.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr>
<th>Method</th>
<th>COCO-Stuff</th>
<th>COCO-Object</th>
<th>VOC</th>
<th>Context</th>
<th>Cityscapes</th>
</tr>
</thead>
<tbody>
<tr><td>SCLIP</td><td>23.9</td><td>32.1</td><td>61.7</td><td>31.5</td><td>34.1</td></tr>
<tr><td>NACLIP</td><td>25.7</td><td>36.2</td><td>64.1</td><td>35.0</td><td>38.3</td></tr>
<tr><td>CaR</td><td>—</td><td>36.6</td><td>67.6</td><td>30.5</td><td>—</td></tr>
<tr><td><strong>ITACLIP</strong></td><td><strong>27.0</strong></td><td><strong>37.7</strong></td><td><strong>67.9</strong></td><td><strong>37.5</strong></td><td><strong>40.2</strong></td></tr>
</tbody>
</table>
</div>

ITACLIP reaches the strongest reported value in the paper on all five benchmarks. Importantly, the method remains **training-free**: it does not introduce pixel-level supervision or a new segmentation-training stage.

The breadth of the improvement also matters. Some competing approaches perform strongly on object-centric datasets but degrade on datasets with many "stuff" categories. ITACLIP is designed to be robust across both object and scene-like semantic classes.

## What does the segmentation actually look like?

The first qualitative comparison uses COCO-Stuff examples:

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/coco-qualitative.png"
  href="/assets/img/publications/itaclip/coco-qualitative.png"
  alt="COCO-Stuff qualitative segmentation comparison between SCLIP, NACLIP, and ITACLIP"
  caption="COCO-Stuff examples comparing the input, ground truth, SCLIP, NACLIP, and ITACLIP."
  credit="Figure 1 from the paper"
  wide=true
%}

The appendix extends the comparison across Pascal VOC, Pascal Context, and COCO-Object:

{% include publication-figure.liquid
  src="/assets/img/publications/itaclip/extended-qualitative.png"
  href="/assets/img/publications/itaclip/extended-qualitative.png"
  alt="Extended qualitative comparison on Pascal VOC, Pascal Context, and COCO-Object"
  caption="Additional qualitative comparison across Pascal VOC, Pascal Context, and COCO-Object."
  credit="Figure 5 from the paper"
  wide=true
%}

The visual pattern mirrors the quantitative results: ITACLIP generally produces cleaner semantic regions and better object boundaries while preserving the open-vocabulary, training-free setting.

## Post-processing helps, but it is not the whole method

The reported main results use PAMR to reduce prediction noise.

Without PAMR:

| COCO-Stuff | COCO-Object | VOC | Context | Cityscapes |
|---:|---:|---:|---:|---:|
| 26.3 | 36.4 | 65.6 | 36.0 | 39.2 |

With PAMR:

| COCO-Stuff | COCO-Object | VOC | Context | Cityscapes |
|---:|---:|---:|---:|---:|
| **27.0** | **37.7** | **67.9** | **37.5** | **40.2** |

The gains are useful but moderate. The architecture, image engineering, and text engineering already produce a strong segmentation model before the final refinement step.

## Takeaway

ITACLIP improves dense CLIP inference without training a segmentation network.

Its three-part strategy is intentionally complementary:

- **architectural enhancement** makes ViT attention more spatially useful;
- **image engineering** asks the visual encoder to agree across multiple equivalent views;
- **LLM-based text generation** gives arbitrary open-vocabulary class names richer semantic representations.

The central idea is that a foundation model can often be pushed much further **at inference time** than a vanilla implementation suggests.

Instead of asking CLIP to learn again, ITACLIP changes how its existing image and language knowledge is exposed to the segmentation task.
