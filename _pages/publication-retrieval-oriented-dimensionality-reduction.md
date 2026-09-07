---
layout: publication
title: "Image Retrieval through Retrieval-Oriented Dimensionality Reduction"
permalink: /publications/retrieval-oriented-dimensionality-reduction/
publication_id: retrieval-oriented-dimensionality-reduction
description: "Retrieval-oriented embedding compression using an autoencoder trained with reconstruction, cosine, decorrelation, and orthogonality objectives."
---

{% include publication-figure.liquid
  src="/assets/img/publications/retrieval-oriented-dimensionality-reduction/group-id-refinement.png"
  href="/assets/img/publications/retrieval-oriented-dimensionality-reduction/group-id-refinement.png"
  alt="DeepFashion item ID split into visually consistent group IDs"
  caption="The paper first refines noisy DeepFashion item IDs into visually consistent group IDs before evaluating retrieval and dimensionality reduction."
  credit="Figure 1 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
Large visual-search systems want two things that naturally pull in opposite directions: <strong>rich high-dimensional embeddings</strong> for retrieval accuracy and <strong>compact vectors</strong> for fast, memory-efficient nearest-neighbor search. This work studies dimensionality reduction specifically from the perspective of retrieval and proposes <strong>AE-MCDO</strong>, an autoencoder whose loss is designed not merely to reconstruct embeddings, but to preserve the geometry that determines who remains a nearest neighbor after compression.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Task</span><strong>Fashion retrieval</strong></div>
  <div class="publication-summary__fact"><span>Dataset</span><strong>DeepFashion In-Shop</strong></div>
  <div class="publication-summary__fact"><span>Backbones</span><strong>9</strong></div>
  <div class="publication-summary__fact"><span>Compression model</span><strong>Autoencoder</strong></div>
  <div class="publication-summary__fact"><span>Proposed loss</span><strong>MCDO</strong></div>
  <div class="publication-summary__fact"><span>Evaluation</span><strong>Hit@K</strong></div>
</div>

## Why dimensionality reduction is a retrieval problem

A high-dimensional visual embedding is useful because it can encode many fine-grained attributes. But its dimension also directly affects storage and the cost of nearest-neighbor distance computation.

The paper frames compression as

$$
x \in \mathbb{R}^{d}
\quad \longrightarrow \quad
z \in \mathbb{R}^{k},
\qquad k \ll d.
$$

The problem is that a representation can reconstruct well while still destroying the local ranking structure used by retrieval.

That distinction is central to the paper:

> a compressed vector should preserve not only the feature itself, but the neighborhood relationships that determine the ranked list.

## The benchmark starts with cleaner identities

The experiments use the In-Shop Clothes Retrieval split of DeepFashion.

The original dataset organizes images by `item_id`, but some item folders contain visually different garments or different groups of images. The paper therefore derives a more fine-grained `group_id` from filename patterns and uses those identities for training and evaluation.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Split</th><th>Images</th><th>Item IDs</th><th>Group IDs</th></tr></thead>
<tbody>
<tr><td>Train</td><td>25,882</td><td>3,997</td><td>6,356</td></tr>
<tr><td>Query</td><td>14,218</td><td>3,985</td><td>6,440</td></tr>
<tr><td>Gallery</td><td>12,612</td><td>3,985</td><td>6,389</td></tr>
</tbody>
</table>
</div>

This avoids judging a compressed representation against a retrieval target that is itself visually inconsistent.

## Which raw embeddings are strongest?

Before dimensionality reduction, the paper benchmarks nine visual backbones.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Backbone</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th><th>Hit@10</th></tr></thead>
<tbody>
<tr><td>ResNet50</td><td>0.1630</td><td>0.2536</td><td>0.2988</td><td>0.3600</td></tr>
<tr><td>EfficientNet-B4</td><td>0.1866</td><td>0.2892</td><td>0.3380</td><td>0.4036</td></tr>
<tr><td>SwAV</td><td>0.2097</td><td>0.3063</td><td>0.3502</td><td>0.4062</td></tr>
<tr><td>EfficientNet-B1</td><td>0.2217</td><td>0.3194</td><td>0.3664</td><td>0.4314</td></tr>
<tr><td>ResNet101</td><td>0.2230</td><td>0.3232</td><td>0.3744</td><td>0.4382</td></tr>
<tr><td>Barlow Twins</td><td>0.2378</td><td>0.3418</td><td>0.3921</td><td>0.4570</td></tr>
<tr><td>SwinV2</td><td>0.2515</td><td>0.3664</td><td>0.4189</td><td>0.4889</td></tr>
<tr><td>DINO</td><td>0.2900</td><td>0.4122</td><td>0.4653</td><td>0.5342</td></tr>
<tr><td><strong>CLIP</strong></td><td><strong>0.3188</strong></td><td><strong>0.4628</strong></td><td><strong>0.5265</strong></td><td><strong>0.6029</strong></td></tr>
</tbody>
</table>
</div>

CLIP is the strongest raw representation at every cutoff and therefore becomes the main test case for comparing dimensionality-reduction strategies.

## Classical dimensionality reduction is harder to beat than expected

The first compression experiment compares several common methods on CLIP embeddings.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th><th>Hit@10</th></tr></thead>
<tbody>
<tr><td>UMAP</td><td>0.0396</td><td>0.0825</td><td>0.1112</td><td>0.1679</td></tr>
<tr><td><strong>PCA</strong></td><td><strong>0.2122</strong></td><td><strong>0.3335</strong></td><td><strong>0.3951</strong></td><td><strong>0.4722</strong></td></tr>
<tr><td>Vanilla Autoencoder</td><td>0.0544</td><td>0.1065</td><td>0.1397</td><td>0.1972</td></tr>
<tr><td>Kernel PCA</td><td>0.2108</td><td>0.3330</td><td>0.3917</td><td>0.4698</td></tr>
<tr><td>LLE</td><td>0.0264</td><td>0.0546</td><td>0.0745</td><td>0.1133</td></tr>
<tr><td>Isomap</td><td>0.0635</td><td>0.1142</td><td>0.1484</td><td>0.2051</td></tr>
</tbody>
</table>
</div>

Two results stand out.

First, **PCA is a very strong baseline**. Compression does not automatically require a neural network.

Second, a naive autoencoder is actually poor for retrieval. Minimizing reconstruction error alone does not protect nearest-neighbor structure.

This motivates a loss designed around retrieval geometry.

## AE-MCDO

The proposed autoencoder maps an input embedding \(x\) to bottleneck representation \(z\) and reconstructs it as \(\hat{x}\):

$$
z = f_{\theta}(x),
\qquad
\hat{x}=g_{\phi}(z).
$$

The key contribution is the **MCDO Loss**, whose name corresponds to four objectives:

<div class="publication-summary__scenario-grid">
  <div class="publication-summary__scenario">
    <span>M</span>
    <h3>Mean Squared Error</h3>
    <p>Preserve the original embedding through reconstruction fidelity.</p>
  </div>

  <div class="publication-summary__scenario">
    <span>C</span>
    <h3>Cosine Similarity</h3>
    <p>Preserve angular alignment, which directly matters for cosine-based retrieval.</p>
  </div>

  <div class="publication-summary__scenario">
    <span>D</span>
    <h3>Decorrelation</h3>
    <p>Discourage redundant bottleneck dimensions so each compressed feature carries distinct information.</p>
  </div>

  <div class="publication-summary__scenario">
    <span>O</span>
    <h3>Orthogonality</h3>
    <p>Regularize the encoder toward a well-conditioned, non-degenerate latent basis.</p>
  </div>
</div>

## M — reconstruction fidelity

The ordinary reconstruction term is

$$
\mathcal{L}_{MSE}
=
\frac{1}{N}
\sum_{i=1}^{N}
\left\|
x_i-\hat{x}_i
\right\|_2^2.
$$

This keeps the compressed representation informative about the source vector, but by itself it does not guarantee ranking preservation.

## C — cosine preservation

Fashion retrieval commonly compares normalized embeddings through cosine similarity or inner product.

MCDO therefore adds

$$
\mathcal{L}_{cos}
=
1
-
\frac{1}{N}
\sum_{i=1}^{N}
\frac{
x_i\cdot\hat{x}_i
}{
\|x_i\|_2\|\hat{x}_i\|_2
}.
$$

This explicitly penalizes changes in embedding direction.

The distinction matters because two reconstructions can have similar Euclidean error while differing substantially in angular orientation—and therefore produce different nearest neighbors under cosine search.

## D — bottleneck decorrelation

Let \(Z\) denote the batch of bottleneck representations. The paper defines the covariance-like matrix

$$
C
=
\frac{1}{N-1}Z^{\top}Z.
$$

The decorrelation loss pushes diagonal entries toward one while penalizing off-diagonal correlations:

$$
\mathcal{L}_{decorr}
=
\sum_{j=1}^{k}
(C_{jj}-1)^2
+
\lambda
\sum_{p\neq q}
C_{pq}^2.
$$

This encourages a compact representation whose dimensions are informative without repeatedly encoding the same direction.

## O — encoder orthogonality

The final encoder projection \(W\) is also regularized toward an orthogonal basis:

$$
\mathcal{L}_{ortho}
=
\frac{1}{k^2}
\left\|
WW^\top-I_k
\right\|_F^2.
$$

This acts as a learned analogue to one of PCA's useful structural properties: latent directions should remain well separated rather than collapsing onto redundant axes.

## The complete MCDO objective

The final loss is

$$
\mathcal{L}_{MCDO}
=
\alpha\mathcal{L}_{MSE}
+
\beta\mathcal{L}_{cos}
+
\gamma\mathcal{L}_{decorr}
+
\delta\mathcal{L}_{ortho}.
$$

The paper uses

$$
\alpha=\beta=0.5,
\qquad
\gamma=10^{-2},
\qquad
\delta=10^{-3}.
$$

The loss therefore gives most of its direct weight to reconstruction and angular preservation, with smaller regularizers enforcing latent geometry.

## Does the retrieval-oriented loss matter?

On CLIP embeddings, the progression is clear:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Autoencoder variant</th><th>Hit@1</th><th>Hit@3</th><th>Hit@5</th><th>Hit@10</th></tr></thead>
<tbody>
<tr><td>AE</td><td>0.0543</td><td>0.1065</td><td>0.1397</td><td>0.1972</td></tr>
<tr><td>AE-MSE</td><td>0.2366</td><td>0.3646</td><td>0.4318</td><td>0.5178</td></tr>
<tr><td><strong>AE-MCDO</strong></td><td><strong>0.2663</strong></td><td><strong>0.4121</strong></td><td><strong>0.4834</strong></td><td><strong>0.5745</strong></td></tr>
</tbody>
</table>
</div>

AE-MCDO improves substantially over the MSE-only neural baseline.

It also beats PCA on every CLIP cutoff:

- Hit@1: **0.2122 → 0.2663**
- Hit@3: **0.3335 → 0.4121**
- Hit@5: **0.3951 → 0.4834**
- Hit@10: **0.4722 → 0.5745**

The lesson is not simply that an autoencoder beats PCA. A *retrieval-oriented* autoencoder beats PCA, while a generic reconstruction autoencoder does not.

## Does the loss generalize beyond CLIP?

The paper repeats the PCA / AE-MSE / AE-MCDO comparison across nine backbones.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Backbone</th><th>PCA Hit@1</th><th>AE-MSE Hit@1</th><th>AE-MCDO Hit@1</th><th>Best Hit@10</th></tr>
</thead>
<tbody>
<tr><td>Barlow Twins</td><td><strong>0.1701</strong></td><td>0.1568</td><td>0.1670</td><td><strong>0.3725 (MCDO)</strong></td></tr>
<tr><td>CLIP</td><td>0.2122</td><td>0.2364</td><td><strong>0.2664</strong></td><td><strong>0.5749 (MCDO)</strong></td></tr>
<tr><td>DINO</td><td>0.1831</td><td>0.2274</td><td><strong>0.2503</strong></td><td><strong>0.5187 (MCDO)</strong></td></tr>
<tr><td>EfficientNet-B1</td><td>0.1390</td><td>0.1237</td><td><strong>0.1493</strong></td><td><strong>0.3690 (MCDO)</strong></td></tr>
<tr><td>EfficientNet-B4</td><td>0.1170</td><td>0.0959</td><td><strong>0.1362</strong></td><td><strong>0.3451 (MCDO)</strong></td></tr>
<tr><td>ResNet101</td><td>0.1440</td><td>0.1446</td><td><strong>0.1818</strong></td><td><strong>0.4082 (MCDO)</strong></td></tr>
<tr><td>ResNet50</td><td>0.1115</td><td>0.0990</td><td><strong>0.1298</strong></td><td><strong>0.3243 (MCDO)</strong></td></tr>
<tr><td>SwAV</td><td>0.1364</td><td>0.1346</td><td><strong>0.1431</strong></td><td><strong>0.3495 (MCDO)</strong></td></tr>
<tr><td>SwinV2</td><td>0.1646</td><td>0.1734</td><td><strong>0.2153</strong></td><td><strong>0.4711 (MCDO)</strong></td></tr>
</tbody>
</table>
</div>

AE-MCDO is strongest at Hit@1 for almost every backbone. The one exception in the table is Barlow Twins, where PCA has a slightly higher Hit@1, while MCDO becomes better at deeper cutoffs.

That exception is useful: the result is strong without pretending the proposed method dominates every individual cell.

## Compactness versus raw accuracy

Compression still carries a cost relative to the original high-dimensional representation.

For CLIP:

- raw Hit@1 = **0.3188**
- AE-MCDO compressed Hit@1 = **0.2664**

The goal is therefore not to claim that dimensionality reduction creates information from nothing. It is to retain as much useful retrieval structure as possible in a smaller representation.

The paper motivates this with the downstream needs of ANN retrieval:

- fewer stored values per item,
- cheaper distance computation,
- smaller indexes,
- improved scalability.

The reported experiments focus primarily on **Hit@K preservation** rather than a direct end-to-end latency or memory benchmark, so these system benefits should be read as the deployment motivation for compression rather than as separately measured system results in this paper.

## Why manifold methods struggle here

UMAP, LLE, and Isomap perform poorly in this retrieval setting.

Those methods can be useful when the objective is visualization or preservation of a particular manifold geometry, but the representation required for scalable nearest-neighbor fashion search is different: the compressed space must preserve a globally usable metric for unseen query-to-gallery comparisons.

PCA succeeds because it provides a stable linear projection with decorrelated directions.

AE-MCDO succeeds because it learns a nonlinear mapping while explicitly reintroducing the geometric constraints that a naive autoencoder lacks.

## Takeaway

The main conclusion is methodological:

> **dimensionality reduction for retrieval should optimize retrieval geometry, not reconstruction alone.**

MSE asks whether the decoder can rebuild the original vector.

MCDO additionally asks whether:

- its direction remains aligned,
- its bottleneck dimensions remain non-redundant,
- and its learned basis remains well conditioned.

That combination transforms the autoencoder from a generic compressor into a retrieval-oriented embedding reducer.

For large-scale image search, the work suggests that the right question is not merely **“How small can the vector become?”** but rather:

> **“How much of the ranking structure can we preserve in the smaller space?”**
