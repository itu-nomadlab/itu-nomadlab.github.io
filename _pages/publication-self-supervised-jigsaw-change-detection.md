---
layout: publication
title: "Enhancing Change Detection with Self-Supervised Jigsaw Loss"
permalink: /publications/self-supervised-jigsaw-change-detection/
publication_id: self-supervised-jigsaw-change-detection
description: "Jigsaw Change Detection augments supervised remote-sensing change segmentation with a self-supervised spatial deshuffling objective."
---

{% include publication-figure.liquid
  src="/assets/img/publications/self-supervised-jigsaw-change-detection/architecture.png"
  href="/assets/img/publications/self-supervised-jigsaw-change-detection/architecture.png"
  alt="Overview of the Jigsaw Change Detection architecture"
  caption="JCD augments a dual encoder-decoder change-detection backbone with a jigsaw classifier operating on shuffled decoder outputs, forcing the network to learn stronger spatial structure."
  credit="Figure 2 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
Change detection is normally trained to answer a single question: <strong>which pixels changed between two timestamps?</strong> Jigsaw Change Detection (JCD) adds a second question during training: <strong>does the network understand how the predicted spatial structure should be arranged?</strong> By turning shuffled segmentation outputs into a self-supervised jigsaw puzzle, JCD uses spatial reasoning as an auxiliary regularizer for the main remote-sensing segmentation task.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Task</span><strong>Change detection</strong></div>
  <div class="publication-summary__fact"><span>Auxiliary signal</span><strong>Jigsaw loss</strong></div>
  <div class="publication-summary__fact"><span>Datasets</span><strong>CDD · SYSU · NJDS</strong></div>
  <div class="publication-summary__fact"><span>Jigsaw grid</span><strong>3 × 3</strong></div>
  <div class="publication-summary__fact"><span>Permutations</span><strong>100</strong></div>
  <div class="publication-summary__fact"><span>Main metric</span><strong>F1</strong></div>
</div>

## Why add a jigsaw task?

Bitemporal change detection requires more than identifying local appearance differences. The model must understand whether those differences form a coherent spatial object, boundary, or region.

JCD therefore adds a self-supervised auxiliary task to a supervised segmentation model. The main branch predicts change masks, while the auxiliary branch receives shuffled versions of the predicted segmentation outputs and tries to recover the permutation that was applied.

The goal is not to solve a puzzle for its own sake. The jigsaw task forces the decoder to preserve spatial structure that is useful for the actual change-localization problem.

## The auxiliary objective

The model predicts two directional segmentation maps,

$$
P_{T1-T2}
\qquad\text{and}\qquad
P_{T2-T1},
$$

corresponding to the two temporal directions.

Each prediction is divided into a \(3\times3\) grid, shuffled using a predefined permutation matrix, and sent to a discriminator/classifier that predicts the original permutation label.

{% include publication-figure.liquid
  src="/assets/img/publications/self-supervised-jigsaw-change-detection/jigsaw-task.png"
  href="/assets/img/publications/self-supervised-jigsaw-change-detection/jigsaw-task.png"
  alt="Jigsaw auxiliary task applied to the two directional change predictions"
  caption="Both directional segmentation predictions are shuffled with predefined permutation matrices and passed to a shuffle predictor. Correctly identifying the permutation provides self-supervised spatial supervision."
  credit="Figure 1 from the paper"
  wide=true
%}

Rather than sampling from all possible \(9!\) tile permutations, the method preselects **100 permutations** with large pairwise Hamming distance so that the spatial arrangements remain sufficiently distinct.

## Architecture

JCD builds on a shared-weight dual encoder-decoder design inspired by SGSLN.

The two temporal images \(T1\) and \(T2\) are processed with shared encoders. Partial channel exchange allows each branch to incorporate information from the other timestamp. Feature-change blocks and skip connections then guide the decoders toward fine-grained localization.

The architectural novelty is the jigsaw module attached to the directional decoder outputs.

This means the same network learns three related outputs:

- \(P_{change}\): the final change mask;
- \(P_{T1-T2}\): directional segmentation from \(T1\) to \(T2\);
- \(P_{T2-T1}\): directional segmentation from \(T2\) to \(T1\).

## The joint loss

The supervised segmentation objective is combined with the self-supervised jigsaw objective.

The paper defines the total loss as

$$
\mathcal{L}_{total}
=
\mathcal{L}_{Dice}(P_{change},G_{change})
+
\mathcal{L}_{Dice}(P_{T1-T2},G_{seg})
+
\mathcal{L}_{Dice}(P_{T2-T1},G_{seg})
+
0.3\Big(
\mathcal{L}_{Jig}(P_{T1-T2},R_1)
+
\mathcal{L}_{Jig}(P_{T2-T1},R_2)
\Big),
$$

where:

- \(\mathcal{L}_{Dice}\) supervises change segmentation;
- \(\mathcal{L}_{Jig}\) is a cross-entropy loss over permutation labels;
- \(R_1\) and \(R_2\) are the selected jigsaw permutations.

The jigsaw objective therefore acts as a structural regularizer rather than replacing the main supervised task.

## Three datasets, three different regimes

### CDD

CDD contains **16,000** Google Earth image pairs spanning buildings, roads, vehicles, and seasonal conditions. Images are resized to \(256\times256\), with:

- 10,000 training pairs
- 3,000 validation pairs
- 3,000 test pairs

### SYSU

SYSU contains **20,000** high-resolution aerial-image pairs over Hong Kong from 2007–2014. It includes urban expansion, vegetation changes, infrastructure construction, and shoreline variation. The paper follows a 60/20/20 split.

### NJDS

NJDS contains one bitemporal satellite pair of Nanjing from 2014 and 2018. The scene is cropped into overlapping \(256\times256\) patches with stride 128, producing:

- 540 training patches
- 152 validation patches
- 1,827 test patches

The three benchmarks therefore cover different scales and change patterns.

## Main results

### CDD

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
<tbody>
<tr><td>BiT</td><td>96.19</td><td>93.99</td><td>95.08</td></tr>
<tr><td>SNUNet</td><td>96.30</td><td>96.20</td><td>96.25</td></tr>
<tr><td>TransUNetCD</td><td>96.93</td><td>97.42</td><td>97.17</td></tr>
<tr><td>SGSLN</td><td>98.25</td><td>97.29</td><td>97.77</td></tr>
<tr><td><strong>JCD</strong></td><td><strong>99.94</strong></td><td><strong>99.48</strong></td><td><strong>99.71</strong></td></tr>
</tbody>
</table>
</div>

On CDD, JCD improves F1 from **97.77%** for SGSLN to **99.71%**.

### SYSU

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
<tbody>
<tr><td>BiT</td><td>81.14</td><td>76.48</td><td>78.74</td></tr>
<tr><td>DARNet</td><td>83.04</td><td>79.11</td><td>81.03</td></tr>
<tr><td>SGSLN</td><td>84.76</td><td>81.45</td><td>83.07</td></tr>
<tr><td><strong>JCD</strong></td><td><strong>85.83</strong></td><td><strong>82.29</strong></td><td><strong>84.02</strong></td></tr>
</tbody>
</table>
</div>

On SYSU, JCD reaches **84.02% F1**, again improving over the SGSLN base model.

### NJDS

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Method</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
<tbody>
<tr><td>MTU-Net</td><td>65.29</td><td>62.82</td><td>63.92</td></tr>
<tr><td>SFCCD</td><td>74.49</td><td>65.19</td><td>69.53</td></tr>
<tr><td>SGSLN</td><td>79.92</td><td>69.51</td><td>74.35</td></tr>
<tr><td><strong>JCD</strong></td><td>74.21</td><td><strong>75.77</strong></td><td><strong>74.98</strong></td></tr>
</tbody>
</table>
</div>

JCD trades some precision for higher recall on NJDS, producing the strongest overall F1 among the listed methods.

## Why 100 permutations?

The jigsaw task needs enough permutation diversity to be informative, but too many classes make the auxiliary task unnecessarily difficult.

The ablation on CDD shows a clear optimum:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Permutation count</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
<tbody>
<tr><td>30</td><td>85.10</td><td>81.02</td><td>83.01</td></tr>
<tr><td>50</td><td>91.52</td><td>88.08</td><td>89.76</td></tr>
<tr><td><strong>100</strong></td><td><strong>99.94</strong></td><td><strong>99.48</strong></td><td><strong>99.71</strong></td></tr>
<tr><td>200</td><td>77.49</td><td>86.33</td><td>81.67</td></tr>
</tbody>
</table>
</div>

The auxiliary task therefore works best in a balanced regime: complex enough to force spatial reasoning, but not so large that learning the permutation classification dominates or destabilizes the primary task.

## What the change maps look like

The qualitative NJDS examples compare the original SGSLN backbone with JCD.

{% include publication-figure.liquid
  src="/assets/img/publications/self-supervised-jigsaw-change-detection/qualitative.png"
  href="/assets/img/publications/self-supervised-jigsaw-change-detection/qualitative.png"
  alt="NJDS qualitative comparison of t1, t2, ground truth, SGSLN, and JCD"
  caption="NJDS examples. JCD produces cleaner masks with fewer irrelevant regions and closer alignment to the ground-truth change areas than SGSLN."
  credit="Figure 3 from the paper"
  wide=true
%}

The qualitative pattern matches the quantitative results: the auxiliary jigsaw objective reduces scattered false detections and helps the decoder produce more structurally coherent change regions.

## What the jigsaw task is really doing

The jigsaw branch can be interpreted as a form of **self-supervised structural pressure**.

The main loss asks:

> Which pixels are different?

The auxiliary loss asks:

> Are the predicted spatial parts arranged in a coherent configuration?

That second objective makes it harder for the decoder to rely only on local cues. To recover the permutation, it must learn relationships between spatial regions.

This is especially relevant in remote sensing, where a changed building or road is not merely a collection of independent pixels; it has geometry.

## Takeaway

JCD demonstrates that self-supervised learning does not have to be a separate pretraining stage.

A small auxiliary task can be embedded directly inside a supervised segmentation pipeline and used as an inductive bias.

The core idea is compact:

> **If a model can reason about how its own change-mask pieces fit together, it can learn to localize change more coherently.**

Across CDD, SYSU, and NJDS, that extra spatial reasoning consistently improves the base change-detection architecture.
