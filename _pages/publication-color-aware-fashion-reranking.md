---
layout: publication
title: "Color-Aware Re-Ranking for Fashion Image Retrieval"
permalink: /publications/color-aware-fashion-reranking/
publication_id: color-aware-fashion-reranking
description: "CA-Rank adds segmentation-driven perceptual color reasoning to embedding-based fashion retrieval without retraining the underlying backbone."
---

{% include publication-figure.liquid
  src="/assets/img/publications/color-aware-fashion-reranking/pipeline.jpg"
  href="/assets/img/publications/color-aware-fashion-reranking/pipeline.jpg"
  alt="Overview of the CA-Rank color-aware fashion retrieval pipeline"
  caption="CA-Rank first retrieves semantically similar garments with an embedding model, then re-ranks the top candidates using color similarity computed only on segmented garment regions."
  credit="Figure 1 from the manuscript"
  wide=true
%}

<p class="publication-summary__lede">
Modern image-retrieval systems are very good at recognizing <strong>what</strong> a garment is, yet they can still return the right silhouette in the wrong color. <strong>CA-Rank</strong> treats that mismatch as a ranking problem rather than a representation-learning problem: keep the semantic embedding model as-is, isolate the garment, measure perceptual color similarity, and use that signal only to refine the top of the retrieval list.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Benchmark</span><strong>DeepFashion In-Shop</strong></div>
  <div class="publication-summary__fact"><span>Segmentation set</span><strong>6,921 images</strong></div>
  <div class="publication-summary__fact"><span>Retrieval queries</span><strong>14,218</strong></div>
  <div class="publication-summary__fact"><span>Gallery images</span><strong>12,612</strong></div>
  <div class="publication-summary__fact"><span>Selected segmenter</span><strong>HQ-SAM</strong></div>
  <div class="publication-summary__fact"><span>Training</span><strong>None for re-ranking</strong></div>
</div>

## The retrieval problem is not only semantic

Fashion retrieval is unusually sensitive to chromatic mismatch. Two garments can have the same category, silhouette, pose, and texture while feeling obviously different to a shopper because the color is wrong.

Embedding backbones tend to optimize semantic and structural similarity. CA-Rank therefore leaves the backbone untouched and introduces an explicit color signal **after retrieval**.

The design is model-agnostic:

1. segment the garment in query and gallery images;
2. compute the usual embedding similarity;
3. retrieve the top-$K$ candidates with an ANN index;
4. compute color similarity on the segmented garment pixels;
5. fuse semantic and chromatic similarity;
6. re-order the existing candidate list.

No backbone fine-tuning is required.

## First remove the background

Color is only useful if it belongs to the garment. Skin, hair, accessories, walls, and scene illumination can easily dominate raw pixel statistics.

For an image $I$ and binary garment mask $M$,

$$
I_{\mathrm{seg}} = I \odot M.
$$

Both embedding extraction and color statistics are then computed on the segmented garment region.

The paper benchmarks several class-agnostic segmenters and selects HQ-SAM for the downstream retrieval experiments.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Model</th><th>IoU</th><th>Dice</th><th>Precision</th><th>Recall</th></tr>
</thead>
<tbody>
<tr><td>FastSAM</td><td>0.541</td><td>0.670</td><td>0.557</td><td><strong>0.948</strong></td></tr>
<tr><td>MobileSAM</td><td>0.699</td><td>0.758</td><td>0.773</td><td>0.761</td></tr>
<tr><td>SAM2.1-B</td><td>0.646</td><td>0.700</td><td>0.703</td><td>0.715</td></tr>
<tr><td>SAM2-B</td><td>0.653</td><td>0.712</td><td>0.704</td><td>0.744</td></tr>
<tr><td>SAM-B</td><td>0.630</td><td>0.678</td><td>0.736</td><td>0.655</td></tr>
<tr><td>SEEM</td><td>0.433</td><td>0.586</td><td>0.437</td><td><strong>0.980</strong></td></tr>
<tr><td><strong>HQ-SAM-B</strong></td><td><strong>0.792</strong></td><td><strong>0.856</strong></td><td><strong>0.853</strong></td><td>0.876</td></tr>
</tbody>
</table>
</div>

HQ-SAM provides the strongest overall mask quality, which is important because errors in garment boundaries become errors in the color descriptor.

## Two ways to describe garment color

CA-Rank evaluates two complementary color representations.

### Weighted Color Matching

Weighted Color Matching (WCM) uses discrete HSV color categories. If a segmented garment contains colors $c_j$ with pixel counts $n_j$, the color composition is

$$
\mathcal{C}
=
\{(c_j,n_j)\}_{j=1}^{N_c},
\qquad
p(c_j)
=
\frac{n_j}{\sum_{k=1}^{N_c} n_k}.
$$

For query $q$ and gallery candidate $g_i$,

$$
S_{\mathrm{color}}(q,g_i)
=
\sum_{c\in C_q\cap C_g}
p_q(c)\,p_g(c).
$$

Very small bins—below 10% of garment pixels—are removed to suppress noise.

WCM is transparent and easy to interpret, but it is still tied to coarse color categories.

### Weighted Chamfer Similarity

Weighted Chamfer Similarity (WCS) moves to CIE-LAB and represents each garment as a compact weighted palette:

$$
\mathcal{P}
=
\{(\mathbf{x}_j,w_j)\}_{j=1}^{N_c},
\qquad
w_j
=
\frac{n_j}{\sum_k n_k}.
$$

The symmetric weighted Chamfer distance between palettes $A$ and $B$ is

$$
D_{\mathrm{Chamfer}}(A,B)
=
\frac{1}{2}
\left(
\sum_i w_i \min_k \lVert \mathbf{a}_i-\mathbf{b}_k\rVert_2
+
\sum_k v_k \min_i \lVert \mathbf{b}_k-\mathbf{a}_i\rVert_2
\right).
$$

It is converted into similarity by

$$
S_{\mathrm{color}}(q,g_i)
=
\frac{1}
{1+k\,D_{\mathrm{Chamfer}}(A,B)}.
$$

Unlike discrete category overlap, WCS can respond smoothly to mixed hues, illumination changes, and perceptually nearby colors.

## Why quantization wins

The manuscript directly compares discrete color detection with palette quantization:

{% include publication-figure.liquid
  src="/assets/img/publications/color-aware-fashion-reranking/color-representation.png"
  href="/assets/img/publications/color-aware-fashion-reranking/color-representation.png"
  alt="Comparison between direct color detection and color quantization on segmented garments"
  caption="Direct HSV color detection is interpretable but coarse; palette quantization captures continuous color variation more faithfully."
  credit="Figure 2 from the manuscript"
  wide=true
%}

This difference explains why WCS is the stronger final re-ranking signal. It does not require an exact categorical color match; it measures how far the dominant palette components are from one another in a perceptually meaningful space.

## Semantic similarity stays in the loop

CA-Rank does not replace embedding similarity with color.

The final score is an equal fusion:

$$
S_{\mathrm{final}}(q,g_i)
=
\frac{1}{2}
\left(
S_{\mathrm{emb}}(q,g_i)
+
S_{\mathrm{color}}(q,g_i)
\right).
$$

The semantic retriever therefore determines the candidate set. Color acts only as a **post-retrieval correction** inside the top-$K$ results.

That makes the method plug-and-play across very different backbones.

## Does the improvement survive different backbones?

The paper evaluates supervised CNNs, self-supervised models, vision-language models, and transformer architectures.

Selected Hit@K results are shown below.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Backbone</th><th>Method</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th></tr>
</thead>
<tbody>
<tr><td rowspan="2">ResNet50</td><td>Baseline</td><td>0.163</td><td>0.253</td><td>0.298</td></tr>
<tr><td><strong>WCS</strong></td><td><strong>0.242</strong></td><td><strong>0.305</strong></td><td><strong>0.328</strong></td></tr>

<tr><td rowspan="2">CLIP</td><td>Baseline</td><td>0.319</td><td>0.462</td><td>0.526</td></tr>
<tr><td><strong>WCS</strong></td><td><strong>0.389</strong></td><td><strong>0.492</strong></td><td><strong>0.530</strong></td></tr>

<tr><td rowspan="2">DINOv3</td><td>Baseline</td><td>0.222</td><td>0.348</td><td>0.400</td></tr>
<tr><td><strong>WCS</strong></td><td><strong>0.344</strong></td><td><strong>0.419</strong></td><td><strong>0.448</strong></td></tr>

<tr><td rowspan="2">EfficientNet-B4</td><td>Baseline</td><td>0.186</td><td>0.288</td><td>0.337</td></tr>
<tr><td><strong>WCS</strong></td><td><strong>0.284</strong></td><td><strong>0.350</strong></td><td><strong>0.378</strong></td></tr>

<tr><td rowspan="2">SwinV2</td><td>Baseline</td><td>0.252</td><td>0.367</td><td>0.419</td></tr>
<tr><td><strong>WCS</strong></td><td><strong>0.338</strong></td><td><strong>0.415</strong></td><td><strong>0.446</strong></td></tr>
</tbody>
</table>
</div>

The effect is largest near the top of the ranking, where a user is most sensitive to an obviously mismatched result.

For example:

- ResNet50 Hit@1 rises from **0.163 → 0.242**;
- CLIP rises from **0.319 → 0.389**;
- DINOv3 rises from **0.222 → 0.344**;
- EfficientNet-B4 rises from **0.186 → 0.284**;
- SwinV2 rises from **0.252 → 0.338**.

The gains across very different representations support the main design claim: explicit color reasoning is useful even when the semantic backbone is already strong.

## What the re-ranked lists actually look like

The paper's qualitative figure compares the original embedding ranking with WCM and WCS.

{% include publication-figure.liquid
  src="/assets/img/publications/color-aware-fashion-reranking/qualitative.jpg"
  href="/assets/img/publications/color-aware-fashion-reranking/qualitative.jpg"
  alt="Qualitative comparison between embedding similarity, Weighted Color Matching, and Weighted Chamfer Similarity"
  caption="Baseline retrieval prioritizes semantic structure; WCM and especially WCS move chromatically compatible garments upward while retaining semantic relevance."
  credit="Figure 3 from the manuscript"
  wide=true
%}

The qualitative result is the intuitive version of the Hit@K table: the embedding model already knows what sort of clothing item it is looking for, while CA-Rank prevents visually implausible color substitutions from dominating the top results.

## Why this is useful in practice

CA-Rank has a deliberately modest systems requirement:

- no retraining of the backbone;
- no modification to the ANN index;
- no change to the original embedding architecture;
- no requirement that the retrieval model itself be color-aware.

The re-ranker only needs garment masks and a color descriptor for the query and the retrieved candidates.

That makes it especially useful for an existing visual-search system where retraining the entire embedding stack would be expensive or operationally risky.

## Takeaway

CA-Rank argues for a simple separation of responsibilities.

The embedding model answers:

> **Is this the same kind of garment?**

The color-aware re-ranker asks:

> **Among the semantically plausible garments, which ones actually look chromatically compatible?**

By segmenting the garment first and applying perceptual LAB-space palette matching only after semantic retrieval, the system improves ranking quality without asking a general-purpose backbone to relearn fashion color from scratch.

For fashion search, semantic similarity is necessary—but sometimes the difference between a useful result and an obviously wrong one is simply **the color**.
