---
layout: publication
title: "Occlusion-Aware Face Retrieval: Identity Restoration through Generative Inpainting"
permalink: /publications/occlusion-aware-face-retrieval/
publication_id: occlusion-aware-face-retrieval
description: "A benchmarking pipeline for studying how realistic facial occlusions distort retrieval embeddings and how generative inpainting restores identity-preserving information."
---

{% include publication-figure.liquid
  src="/assets/img/publications/occlusion-aware-face-retrieval/occlusion-removal-pipeline.png"
  href="/assets/img/publications/occlusion-aware-face-retrieval/occlusion-removal-pipeline.png"
  alt="Pipeline showing raw image, occluded image, mask, inpainting model, and occlusion-removed image"
  caption="The restoration stage: an occluded face and its binary mask are fed to an inpainting model to reconstruct identity-relevant facial content."
  credit="Figure 3 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
This paper turns occlusion-robust face retrieval into a <strong>controlled benchmark problem</strong>. Instead of evaluating inpainting only by visual realism, it asks a sharper question: <strong>does reconstruction recover identity?</strong> The pipeline synthesizes realistic occlusions on LFW faces, removes them with several generative inpainting models, and measures whether identity-preserving embeddings move back toward the correct person in retrieval.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Dataset</span><strong>LFW</strong></div>
  <div class="publication-summary__fact"><span>Queries</span><strong>1,680</strong></div>
  <div class="publication-summary__fact"><span>Gallery</span><strong>7,485</strong></div>
  <div class="publication-summary__fact"><span>Occlusions</span><strong>Cap, mask, scarf, sunglasses</strong></div>
  <div class="publication-summary__fact"><span>Inpainting models</span><strong>4</strong></div>
  <div class="publication-summary__fact"><span>Embedding models</span><strong>8</strong></div>
</div>

## The problem

Face retrieval systems often fail when the query image is partially hidden by scarves, sunglasses, caps, or masks. Occlusion does not merely remove pixels; it alters the embedding itself, pushing the query away from its true identity neighborhood. The paper proposes a full evaluation pipeline for this failure mode and studies whether generative inpainting can reverse the damage.

The core insight is simple: a reconstruction can look plausible and still be wrong for retrieval. That is why the work combines <strong>visual quality metrics</strong> with <strong>identity-aware retrieval metrics</strong>.

## Data split and benchmark setup

The study uses the Labeled Faces in the Wild (LFW) dataset. Only identities with at least two images are used. For each of the <strong>1,680</strong> eligible identities, the first image is taken as the query and the remaining images populate a gallery of <strong>7,485</strong> faces.

{% include publication-figure.liquid
  src="/assets/img/publications/occlusion-aware-face-retrieval/lfw-dataset-examples.png"
  href="/assets/img/publications/occlusion-aware-face-retrieval/lfw-dataset-examples.png"
  alt="Example LFW query and gallery images"
  caption="Sample query and gallery images from LFW, illustrating variation in pose, lighting, expression, and background."
  credit="Figure 1 from the paper"
  wide=true
%}

This split makes the retrieval task identity-sensitive: a query is successful only when the correct identity appears among the top-ranked gallery images.

## Stage 1: realistic occlusion synthesis

The paper does not use crude rectangular masks. Instead, it first detects facial landmarks with <strong>MediaPipe Face Mesh</strong>, then builds semantically meaningful masks for predefined occlusion types. Stable Diffusion 2 is then used to generate realistic occluding content.

Given an original image \(I_o\), a binary mask \(M\), and generated occlusion content \(I_{gen}\), the occluded image is defined as

$$
I_{occ} = (1 - M) \odot I_o + M \odot I_{gen}.
$$

{% include publication-figure.liquid
  src="/assets/img/publications/occlusion-aware-face-retrieval/occlusion-generation-pipeline.png"
  href="/assets/img/publications/occlusion-aware-face-retrieval/occlusion-generation-pipeline.png"
  alt="Pipeline for facial landmark detection, mask generation, and realistic occlusion synthesis"
  caption="Occlusion synthesis: landmarks are extracted, object-specific masks are produced, and Stable Diffusion generates semantically consistent occlusions."
  credit="Figure 2 from the paper"
  wide=true
%}

This stage matters because the later retrieval results should reflect realistic corruption, not toy perturbations.

## Stage 2: generative identity restoration

The occluded image and its mask are then passed to an inpainting model. The goal is not only to remove the artifact, but to regenerate facial content that lands closer to the correct identity in embedding space.

If \(I_{inpainted}\) denotes the generated content inside the masked region, the restored image is

$$
I_{rec} = (1 - M) \odot I_{occ} + M \odot I_{inpainted}.
$$

The paper evaluates four inpainting methods:

- <strong>Stable Diffusion</strong>
- <strong>AOT-GAN</strong>
- <strong>DeepFillv2</strong>
- <strong>PixelHacker</strong>

## Stage 3: embedding extraction and retrieval

The restored images are evaluated through retrieval rather than only reconstruction metrics. The paper compares eight embedding families:

- ResNet50
- ResNet101
- EfficientNetB1
- EfficientNetB4
- CLIP
- SwAV
- Barlow Twins
- DINO

For an input image \(I\), the chosen embedding model \(\Phi(\cdot)\) produces

$$
v = \Phi(I), \qquad \hat{v} = \frac{v}{\lVert v \rVert_2}.
$$

Similarity is computed with cosine distance, and retrieval quality is reported with <strong>Hit@k</strong>:

$$
\mathrm{Hit@k} = \frac{1}{N} \sum_{i=1}^{N} \mathbf{1}\!\left[ ID_{query_i} \in \{ID_{top-k}\} \right].
$$

This directly measures whether identity has been preserved well enough to recover the correct person.

## Reconstruction quality: visual realism vs. structural fidelity

The paper reports multiple quality metrics—LPIPS, SSIM, PSNR, and FSIM—to avoid relying on a single notion of quality. The overall pattern is important:

- <strong>DeepFillv2</strong> is the most consistent leader in <strong>SSIM, PSNR, and FSIM</strong>.
- <strong>Stable Diffusion</strong> usually achieves the <strong>lowest LPIPS</strong> and often looks the most visually realistic.
- The best perceptual score does <strong>not automatically</strong> mean the best identity preservation.

A compact summary of the best scores per occlusion type is below.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Occlusion</th><th>Best LPIPS ↓</th><th>Best SSIM ↑</th><th>Best PSNR ↑</th><th>Best FSIM ↑</th></tr>
</thead>
<tbody>
<tr><td>Cap</td><td>Stable Diffusion (0.0703)</td><td>DeepFillv2 (0.9044)</td><td>DeepFillv2 (22.4719)</td><td>DeepFillv2 (0.9352)</td></tr>
<tr><td>Medical mask</td><td>Stable Diffusion (0.0320)</td><td>DeepFillv2 (0.9341)</td><td>DeepFillv2 (28.1723)</td><td>DeepFillv2 (0.9586)</td></tr>
<tr><td>Scarf</td><td>PixelHacker (0.0767)</td><td>DeepFillv2 (0.8781)</td><td>DeepFillv2 (20.1914)</td><td>DeepFillv2 (0.9211)</td></tr>
<tr><td>Sunglasses</td><td>Stable Diffusion (0.0234)</td><td>DeepFillv2 (0.9541)</td><td>Stable Diffusion (30.0258)</td><td>Stable Diffusion (0.9701)</td></tr>
</tbody>
</table>
</div>

{% include publication-figure.liquid
  src="/assets/img/publications/occlusion-aware-face-retrieval/qualitative-inpainting-comparison.png"
  href="/assets/img/publications/occlusion-aware-face-retrieval/qualitative-inpainting-comparison.png"
  alt="Qualitative comparison of inpainting outputs for medical mask and scarf occlusions"
  caption="Qualitative reconstructions for medical-mask and scarf occlusions. The paper contrasts Stable Diffusion, AOT-GAN, DeepFillv2, and PixelHacker."
  credit="Figure 4 from the paper"
  wide=true
%}

The interesting scientific point is the mismatch between <em>looking good</em> and <em>retrieving correctly</em>. This is exactly why the paper evaluates embeddings downstream.

## Retrieval before occlusion

Without any corruption, CLIP is the strongest retrieval model by a large margin.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Model</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th><th>Hit@10</th><th>Hit@20</th></tr>
</thead>
<tbody>
<tr><td>ResNet50</td><td>0.132</td><td>0.180</td><td>0.211</td><td>0.259</td><td>0.322</td></tr>
<tr><td>ResNet101</td><td>0.123</td><td>0.172</td><td>0.201</td><td>0.246</td><td>0.300</td></tr>
<tr><td>EfficientNetB1</td><td>0.125</td><td>0.185</td><td>0.225</td><td>0.264</td><td>0.308</td></tr>
<tr><td>EfficientNetB4</td><td>0.076</td><td>0.113</td><td>0.145</td><td>0.182</td><td>0.227</td></tr>
<tr><td><strong>CLIP</strong></td><td><strong>0.613</strong></td><td><strong>0.720</strong></td><td><strong>0.766</strong></td><td><strong>0.816</strong></td><td><strong>0.850</strong></td></tr>
<tr><td>SwAV</td><td>0.111</td><td>0.154</td><td>0.175</td><td>0.210</td><td>0.244</td></tr>
<tr><td>Barlow Twins</td><td>0.167</td><td>0.232</td><td>0.257</td><td>0.303</td><td>0.352</td></tr>
<tr><td>DINO</td><td>0.118</td><td>0.162</td><td>0.181</td><td>0.224</td><td>0.267</td></tr>
</tbody>
</table>
</div>

## Retrieval after occlusion

Occlusion degrades every model. The damage is especially severe for self-supervised embeddings like SwAV and Barlow Twins.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Model</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th><th>Hit@10</th><th>Hit@20</th></tr>
</thead>
<tbody>
<tr><td>ResNet50</td><td>0.080</td><td>0.119</td><td>0.147</td><td>0.182</td><td>0.227</td></tr>
<tr><td>ResNet101</td><td>0.089</td><td>0.138</td><td>0.163</td><td>0.205</td><td>0.254</td></tr>
<tr><td>EfficientNetB1</td><td>0.085</td><td>0.131</td><td>0.155</td><td>0.202</td><td>0.254</td></tr>
<tr><td>EfficientNetB4</td><td>0.046</td><td>0.078</td><td>0.099</td><td>0.127</td><td>0.174</td></tr>
<tr><td><strong>CLIP</strong></td><td><strong>0.370</strong></td><td><strong>0.480</strong></td><td><strong>0.531</strong></td><td><strong>0.607</strong></td><td><strong>0.685</strong></td></tr>
<tr><td>SwAV</td><td>0.000</td><td>0.002</td><td>0.005</td><td>0.007</td><td>0.013</td></tr>
<tr><td>Barlow Twins</td><td>0.000</td><td>0.000</td><td>0.002</td><td>0.008</td><td>0.014</td></tr>
<tr><td>DINO</td><td>0.094</td><td>0.142</td><td>0.164</td><td>0.192</td><td>0.231</td></tr>
</tbody>
</table>
</div>

The clearest example in the paper is CLIP: Hit@1 falls from <strong>0.613</strong> on raw images to <strong>0.370</strong> on occluded ones.

## Retrieval after inpainting

Inpainting recovers part of the lost performance, but not all of it. Stable Diffusion delivers the best Hit@1 result for most embedding models.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Embedding model</th><th>Raw Hit@1</th><th>Occluded Hit@1</th><th>Best restored Hit@1</th><th>Best method</th></tr>
</thead>
<tbody>
<tr><td>ResNet50</td><td>0.132</td><td>0.080</td><td>0.115</td><td>Stable Diffusion</td></tr>
<tr><td>ResNet101</td><td>0.123</td><td>0.089</td><td>0.090</td><td>Stable Diffusion</td></tr>
<tr><td>EfficientNetB1</td><td>0.125</td><td>0.085</td><td>0.102</td><td>Stable Diffusion</td></tr>
<tr><td>EfficientNetB4</td><td>0.076</td><td>0.046</td><td>0.061</td><td>Stable Diffusion</td></tr>
<tr><td>CLIP</td><td>0.613</td><td>0.370</td><td>0.436</td><td>Stable Diffusion</td></tr>
<tr><td>SwAV</td><td>0.111</td><td>0.000</td><td>0.002</td><td>DeepFillv2</td></tr>
<tr><td>Barlow Twins</td><td>0.167</td><td>0.000</td><td>0.002</td><td>Stable Diffusion</td></tr>
<tr><td>DINO</td><td>0.118</td><td>0.094</td><td>0.121</td><td>Stable Diffusion</td></tr>
</tbody>
</table>
</div>

The pattern is important:

- reconstruction helps, but does <strong>not fully recover</strong> the raw-image baseline;
- the benefit depends strongly on the embedding family;
- models that are visually convincing are not always equally identity-preserving.

{% include publication-figure.liquid
  src="/assets/img/publications/occlusion-aware-face-retrieval/retrieval-examples.png"
  href="/assets/img/publications/occlusion-aware-face-retrieval/retrieval-examples.png"
  alt="Retrieval examples comparing raw, occluded, and occlusion-removed queries"
  caption="Example retrieval behavior across raw, occluded, and restored query images. Green boxes mark correct identity matches."
  credit="Figure 5 from the paper"
  wide=true
%}

## Why this paper matters

The paper contributes more than an application of inpainting. Its real contribution is a <strong>benchmarking viewpoint</strong>:

1. generate realistic, semantically aligned occlusions;
2. remove them with multiple inpainting models;
3. judge the result not only by image realism, but by whether identity retrieval improves.

That last step is what makes the study useful. It shows that perceptual quality metrics alone can miss the downstream failure that matters most.

## Takeaway

The headline result is not simply that generative inpainting makes faces look better. It is that restoration can partially recover identity-sensitive retrieval performance—especially for strong embeddings like CLIP—while also revealing the gap between <strong>perceptual plausibility</strong> and <strong>identity consistency</strong>.

This makes the work a solid reference point for future research on occlusion-robust face retrieval, identity-aware restoration, and evaluation protocols that go beyond appearance alone.
