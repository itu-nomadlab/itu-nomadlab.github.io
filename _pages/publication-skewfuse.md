---
layout: publication
title: "SkewFuse: Unsupervised Confidence-Guided Rank Fusion for Multi-View Image Retrieval"
permalink: /publications/skewfuse/
publication_id: skewfuse
description: "Query-adaptive unsupervised rank fusion that uses similarity-score skewness as a retrieval-confidence signal."
---

{% include publication-figure.liquid
  src="/assets/img/publications/skewfuse/pipeline.png"
  href="/assets/img/publications/skewfuse/pipeline.png"
  alt="Overview of the SkewFuse multi-view image retrieval pipeline"
  caption="Scene and product views are embedded independently, retrieved from separate ANN indexes, and fused with query-specific confidence weights derived from each similarity-score distribution."
  credit="Figure 1 from the manuscript"
  wide=true
%}

<p class="publication-summary__lede">
Different retrieval models can be right for different queries. A scene-oriented embedding may be decisive when pose and context matter, while a product-oriented embedding may be far more certain for a clean catalog view. <strong>SkewFuse</strong> turns that observation into an unsupervised fusion rule: estimate how confident each retrieval list looks from the <strong>shape of its similarity-score distribution</strong>, then give the more confident view more influence in the final rank.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Task</span><strong>Multi-view retrieval</strong></div>
  <div class="publication-summary__fact"><span>Confidence signal</span><strong>Skewness</strong></div>
  <div class="publication-summary__fact"><span>Fusion rule</span><strong>Weighted Dowdall</strong></div>
  <div class="publication-summary__fact"><span>Training for fusion</span><strong>None</strong></div>
  <div class="publication-summary__fact"><span>Query images</span><strong>14,218</strong></div>
  <div class="publication-summary__fact"><span>Gallery images</span><strong>12,612</strong></div>
</div>

## Why fuse multiple retrieval views?

Modern visual-search pipelines frequently have several embeddings available at once. Those embeddings are not redundant: one may emphasize semantic identity, another texture, another product appearance, and another scene-level context.

The usual fusion problem is that a static rule gives every retriever the same importance for every query.

SkewFuse instead asks:

> **How decisive does each model look on this specific query?**

A retrieval list whose score distribution has a sharp positive tail—only a few candidates stand clearly above the rest—is interpreted as more confident. A flatter distribution is interpreted as more ambiguous.

The resulting confidence is estimated directly from the scores. No relevance labels are needed to train a weighting model.

## A noisy benchmark label can corrupt the evaluation

Before fusion, the paper also addresses a dataset-quality problem in In-Shop Clothes Retrieval.

The original folder-level `item_id` can sometimes contain visually different groups. Evaluating those images as one identity introduces label noise.

{% include publication-figure.liquid
  src="/assets/img/publications/skewfuse/group-id-cleanup.png"
  href="/assets/img/publications/skewfuse/group-id-cleanup.png"
  alt="An item ID containing visually different fashion groups and the refined group IDs"
  caption="The original item ID can mix visually distinct apparel groups. SkewFuse experiments use a finer group-level identity derived from filename patterns."
  credit="Figure 2 from the manuscript"
%}

The refined split statistics are:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Split</th><th>Images</th><th>Item IDs</th><th>Group IDs</th></tr>
</thead>
<tbody>
<tr><td>Train</td><td>25,882</td><td>3,997</td><td>6,356</td></tr>
<tr><td>Query</td><td>14,218</td><td>3,985</td><td>6,440</td></tr>
<tr><td>Gallery</td><td>12,612</td><td>3,985</td><td>6,389</td></tr>
</tbody>
</table>
</div>

This matters because fusion quality is only meaningful if the benchmark's notion of a "correct" retrieval is itself coherent.

## Confidence from skewness

For a query, let

$$
S=\{s_1,s_2,\ldots,s_n\}
$$

be the similarity scores produced by one retrieval model.

SkewFuse computes the sample skewness

$$
g
=
\frac{n}{(n-1)(n-2)}
\sum_{i=1}^{n}
\left(
\frac{s_i-\bar{s}}{\sigma}
\right)^3.
$$

The intuition is simple.

A **strong positive skew** means a small number of candidates receive much larger similarity scores than the rest. The model appears to have found a clear match.

A **low or negative skew** means the score mass is less decisive. The model should contribute less strongly to the fusion.

## Bounding the confidence

Raw skewness is converted into a bounded confidence score:

$$
C(S)
=
\frac{\max(0,g)}
{\max(0,g)+K}.
$$

The parameter $K$ controls how quickly positive skewness is converted into confidence.

The original score list is then scaled as

$$
S' = C(S)\cdot S.
$$

So confidence does not replace similarity. It changes how much the model's similarity scores are allowed to influence the fused ranking.

## From Dowdall voting to confidence-weighted fusion

SkewFuse builds on the Dowdall positional voting rule.

Suppose model $m$ returns gallery items

$$
G^m
=
\{g^m_1,g^m_2,\ldots,g^m_k\}
$$

with confidence-weighted scores

$$
S^m
=
\{s^m_1,s^m_2,\ldots,s^m_k\}.
$$

For query $q$, the fused score of gallery item $g$ is

$$
F_q(g)
=
\sum_m
\sum_{i=1}^{k}
\delta(g=g^m_i)
\frac{s^m_i}{i}.
$$

This gives the method three desirable properties:

- higher-ranked candidates receive more weight through the $1/i$ term;
- a more confident retrieval model contributes more strongly;
- the same candidate appearing in multiple lists accumulates support.

The final result is obtained by sorting gallery items by $F_q(g)$.

## The two views are genuinely complementary

Before fusion, the paper evaluates scene and product embeddings separately.

For the **scene** view, CLIP is the strongest single model:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Scene model</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th><th>R@20</th></tr></thead>
<tbody>
<tr><td>Barlow Twins</td><td>0.139</td><td>0.232</td><td>0.272</td><td>0.327</td><td>0.383</td></tr>
<tr><td>SwinV2</td><td>0.148</td><td>0.246</td><td>0.291</td><td>0.352</td><td>0.416</td></tr>
<tr><td>DINO</td><td>0.170</td><td>0.283</td><td>0.327</td><td>0.387</td><td>0.450</td></tr>
<tr><td><strong>CLIP</strong></td><td><strong>0.185</strong></td><td><strong>0.313</strong></td><td><strong>0.369</strong></td><td><strong>0.441</strong></td><td><strong>0.513</strong></td></tr>
</tbody>
</table>
</div>

For the **product** view, DINO and Barlow Twins are strongest at the top:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Product model</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th><th>R@20</th></tr></thead>
<tbody>
<tr><td>SwinV2</td><td>0.134</td><td>0.216</td><td>0.252</td><td>0.303</td><td>0.358</td></tr>
<tr><td>Barlow Twins</td><td>0.162</td><td><strong>0.261</strong></td><td><strong>0.303</strong></td><td><strong>0.357</strong></td><td><strong>0.411</strong></td></tr>
<tr><td><strong>DINO</strong></td><td><strong>0.165</strong></td><td>0.255</td><td>0.291</td><td>0.339</td><td>0.387</td></tr>
</tbody>
</table>
</div>

These differences motivate fusion: the best representation depends on which aspect of the query is most informative.

## Against unsupervised fusion baselines

The main fusion experiment combines **CLIP scene retrieval** with **Barlow Twins product retrieval**.

Among standard unsupervised methods, Dowdall is particularly strong:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th><th>R@20</th></tr></thead>
<tbody>
<tr><td>RRF</td><td>0.198</td><td>0.344</td><td>0.424</td><td>0.513</td><td>0.585</td></tr>
<tr><td>CombMNZ</td><td>0.204</td><td>0.360</td><td>0.430</td><td>0.513</td><td>0.586</td></tr>
<tr><td>CombSum</td><td>0.209</td><td>0.366</td><td>0.431</td><td>0.510</td><td>0.585</td></tr>
<tr><td>ISR</td><td>0.209</td><td>0.369</td><td><strong>0.434</strong></td><td>0.512</td><td>0.585</td></tr>
<tr><td><strong>Dowdall</strong></td><td><strong>0.211</strong></td><td><strong>0.371</strong></td><td><strong>0.434</strong></td><td>0.511</td><td><strong>0.586</strong></td></tr>
</tbody>
</table>
</div>

The important reference point is therefore not a weak single embedding. It is an already competitive rank-fusion baseline.

## SkewFuse versus the strongest fusion strategies

The final comparison is deliberately small:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th><th>R@20</th></tr></thead>
<tbody>
<tr><td>Dowdall</td><td>0.211</td><td><strong>0.371</strong></td><td><strong>0.434</strong></td><td>0.511</td><td>0.586</td></tr>
<tr><td>Mixed (supervised)</td><td>0.212</td><td>0.365</td><td>0.432</td><td><strong>0.515</strong></td><td><strong>0.588</strong></td></tr>
<tr><td><strong>SkewFuse</strong></td><td><strong>0.221</strong></td><td><strong>0.371</strong></td><td>0.431</td><td>0.511</td><td>0.583</td></tr>
</tbody>
</table>
</div>

SkewFuse is designed for **early precision** rather than maximizing every deep-rank metric.

Its Recall@1 increases from **0.211 with Dowdall to 0.221**, a relative improvement of roughly **4.7%** over that strongest unsupervised baseline.

It also surpasses the best supervised R@1 result in the reported comparison—Mixed at 0.212—without learning fusion weights from relevance labels.

## Why query-specific confidence helps

The qualitative examples show the core behavior better than a global metric.

{% include publication-figure.liquid
  src="/assets/img/publications/skewfuse/qualitative.png"
  href="/assets/img/publications/skewfuse/qualitative.png"
  alt="Two SkewFuse examples comparing scene retrieval, product retrieval, and fused results"
  caption="In one query the product embedding is decisive; in the other the scene embedding is. SkewFuse adapts the fusion rather than forcing one fixed weighting for both."
  credit="Figure 3 from the manuscript"
  wide=true
%}

On the left, scene retrieval is ambiguous while product retrieval puts the target first.

On the right, the opposite happens: the scene embedding identifies the correct result at rank one while the product representation is less decisive.

A global fusion weight cannot express both cases simultaneously. Query-specific confidence can.

## How sensitive is the confidence scale?

The only explicit scaling parameter is $K$ in the bounded confidence function.

{% include publication-figure.liquid
  src="/assets/img/publications/skewfuse/k-sensitivity.png"
  href="/assets/img/publications/skewfuse/k-sensitivity.png"
  alt="Recall at 1 as a function of the SkewFuse confidence scaling parameter K"
  caption="Recall@1 remains strong across a broad moderate range of K and degrades only when K becomes so large that confidence weights collapse toward zero."
  credit="Figure 4 from the manuscript"
%}

For very large $K$,

$$
C(S)
=
\frac{\max(0,g)}
{\max(0,g)+K}
\rightarrow 0,
$$

so the confidence weighting is effectively neutralized.

The useful regime is therefore not a narrowly tuned point: the paper reports a broad range in which early-rank performance remains relatively stable.

## Why not learn the weights?

A supervised fusion model can learn that one view is usually more useful than another.

SkewFuse targets a different requirement: **no labeled fusion-training set and no fixed assumption that a view has the same reliability for every query**.

That makes the method attractive when:

- retrieval systems already expose multiple ranked lists;
- relevance labels are limited or noisy;
- the distribution of query types changes;
- top-ranked precision matters more than small gains at deep ranks.

The method is also parameter-light: after the existing retrievers produce similarity lists, confidence estimation is only a distribution statistic plus a bounded transform.

## Takeaway

SkewFuse treats uncertainty in retrieval as something visible in the ranking scores themselves.

When one embedding produces a decisive tail and another produces an ambiguous distribution, the fusion layer should not pretend they are equally trustworthy.

The method therefore adds a lightweight principle to rank aggregation:

> **Let each query decide which retriever deserves more influence.**

By using skewness as an unsupervised confidence signal and combining it with positional Dowdall weighting, SkewFuse improves the part of the ranking that matters most in many real search systems: **the first few results**.
