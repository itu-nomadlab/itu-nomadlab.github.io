---
layout: publication
title: "TinyRXNet: A Local RX-Based Architecture for Accurate Segmentation of Small-Scale Objects"
permalink: /publications/tinyrxnet/
publication_id: tinyrxnet
description: "Tiny-object segmentation by combining SAM encoder features with tile-wise Local RX anomaly maps inside a ResNet-based segmentation network."
---

{% include publication-figure.liquid
  src="/assets/img/publications/tinyrxnet/architecture.png"
  href="/assets/img/publications/tinyrxnet/architecture.png"
  alt="TinyRXNet architecture combining ResNet-101, frozen SAM features, Local RX blocks, and a depthwise separable ASPP head"
  caption="TinyRXNet combines a ResNet-101 segmentation backbone with frozen SAM encoder features and Local RX anomaly maps at deep feature levels."
  credit="Architecture figure from the manuscript"
  wide=true
%}

<p class="publication-summary__lede">
Tiny pedestrians in aerial imagery can occupy only a handful of pixels. Standard segmentation networks often treat them as background because the visual evidence is weak and the surrounding scene dominates the representation. <strong>TinyRXNet</strong> approaches the problem from a different angle: a tiny pedestrian is not only a semantic object, but also a <strong>local anomaly</strong> in feature space. The network therefore combines semantic information from SAM with Local Reed-Xiaoli (RX) anomaly scores to amplify locally distinctive regions before segmentation.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Task</span><strong>Tiny-object segmentation</strong></div>
  <div class="publication-summary__fact"><span>Dataset</span><strong>TinyPedSeg</strong></div>
  <div class="publication-summary__fact"><span>Backbone</span><strong>ResNet-101</strong></div>
  <div class="publication-summary__fact"><span>Foundation features</span><strong>SAM</strong></div>
  <div class="publication-summary__fact"><span>Anomaly module</span><strong>Local RX</strong></div>
  <div class="publication-summary__fact"><span>Best tile</span><strong>32 × 32</strong></div>
</div>

## Why tiny objects look like anomalies

A pedestrian viewed from a high-altitude UAV may be only a few pixels wide. The object may not provide enough texture or semantic detail for a conventional segmentation backbone to separate it confidently from roads, pavement, roofs, or vegetation.

Local RX provides a complementary signal.

Instead of asking only:

> **What semantic pattern does this region resemble?**

RX asks:

> **How different is this feature from the features immediately around it?**

That makes the detector naturally suited to tiny objects that are locally unusual even when they are globally insignificant.

{% include publication-figure.liquid
  src="/assets/img/publications/tinyrxnet/local-rx-features.png"
  href="/assets/img/publications/tinyrxnet/local-rx-features.png"
  alt="Local RX applied to an RGB aerial image and to intermediate CNN feature maps"
  caption="Local RX can highlight visually distinctive regions in the input image and can also be applied directly to deep feature maps inside a segmentation network."
  credit="Local RX motivation figure from the manuscript"
  wide=true
%}

The bottom half of the figure is the key idea behind TinyRXNet: RX is not restricted to raw image pixels. It can operate on learned channels in a deep feature map, where semantic distinctions may already be stronger.

## Local Reed-Xiaoli scoring

The RX detector measures how far a feature vector lies from a local background distribution.

For feature vector \(x\), local mean \(\mu\), and covariance matrix \(\Sigma\),

$$
\operatorname{RX}(x)
=
(x-\mu)^{\top}
\Sigma^{-1}
(x-\mu).
$$

This is a Mahalanobis distance.

Unlike Euclidean distance, it accounts for feature correlations and the scale of each direction in the local covariance structure.

A high RX value indicates that a feature is unusual relative to its neighborhood.

## Making RX local

TinyRXNet computes RX on small spatial tiles rather than on the entire feature map.

For a tile containing

$$
X \in \mathbb{R}^{N\times C},
$$

where \(N=T\times T\) and \(C\) is the number of feature channels, the local covariance estimate is

$$
A
=
\frac{1}{N-1}
\sum_{j=1}^{N}
(x_j-\mu)
(x_j-\mu)^{\top}
+
\epsilon I.
$$

Each feature vector receives the score

$$
r_i
=
(x_i-\mu)^{\top}
A^{-1}
(x_i-\mu).
$$

The regularization term \(\epsilon I\) stabilizes covariance inversion.

The resulting RX scores are reshaped back into a spatial map and concatenated with the corresponding deep features.

## Why local statistics matter

A global anomaly detector can miss tiny targets when other strong structures dominate the full image distribution.

Tile-wise statistics change the question.

A pedestrian does not need to be unusual relative to the entire image. It only needs to be unusual relative to the pavement, road, or roof patch surrounding it.

This is especially valuable for crowded top-down imagery where foreground and background occupy dramatically different proportions of the frame.

## Combining SAM with Local RX

TinyRXNet uses two complementary sources of information.

### SAM features: semantic support

A frozen Segment Anything Model encoder provides rich spatial-semantic features. These features can preserve information about small objects that the task-specific backbone may otherwise suppress.

### RX maps: local distinctiveness

Local RX provides a scalar anomaly map identifying locations whose feature vectors deviate strongly from their immediate neighborhood.

TinyRXNet concatenates SAM features with the outputs of the final ResNet blocks, computes Local RX maps from those fused features, and concatenates the anomaly maps back into the segmentation stream.

The SAM model stays frozen; the rest of TinyRXNet is trained.

## Backbone and segmentation heads

The image first passes through convolutional layers and ResNet-101 residual blocks.

The output of the third residual block contributes an auxiliary segmentation loss during training.

The final residual output is passed to a **Depthwise Separable ASPP** head with four parallel branches for the main prediction.

The network therefore combines:

- local convolutional detail,
- deep residual features,
- foundation-model semantics,
- local anomaly information,
- and multi-scale ASPP context.

## TinyPedSeg

Evaluation uses TinyPedSeg, a dataset designed specifically for top-down tiny-pedestrian segmentation.

The manuscript reports:

- **320** high-resolution aerial images;
- **2,563** pixel-annotated pedestrians;
- walking, sitting, and standing poses;
- **268** training images;
- **52** test images.

This is a difficult segmentation regime because a large fraction of the image is background and the objects of interest are extremely small.

## Training setup

All experiments use:

- Adam optimizer;
- learning rate \(1\times10^{-4}\);
- weight decay \(1\times10^{-4}\);
- batch size 2;
- dropout 0.1;
- Tversky loss for the main and auxiliary outputs.

Tversky loss is particularly useful here because tiny pedestrians produce severe foreground/background imbalance.

## Main segmentation results

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Model</th><th>mIoU</th><th>Dice</th></tr></thead>
<tbody>
<tr><td>DeepLab-v3 (U-Net)</td><td>50.28</td><td>66.91</td></tr>
<tr><td>Swin Transformer</td><td>48.09</td><td>64.94</td></tr>
<tr><td>U-Net</td><td>46.84</td><td>63.80</td></tr>
<tr><td>DeepLabv3+ (ResNet-101)</td><td>64.97</td><td>78.77</td></tr>
<tr><td><strong>TinyRXNet</strong></td><td><strong>73.36</strong></td><td><strong>81.94</strong></td></tr>
</tbody>
</table>
</div>

TinyRXNet improves mIoU from **64.97** for the strongest listed baseline to **73.36**.

The gain is especially large in mIoU, which is highly sensitive to false-positive area and boundary quality for very small foreground objects.

## What does SAM contribute? What does RX contribute?

The ablation separates the two components.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>SAM</th><th>Local RX</th><th>mIoU</th><th>Dice</th></tr></thead>
<tbody>
<tr><td>✗</td><td>✗</td><td>64.97</td><td>78.77</td></tr>
<tr><td>✗</td><td>✓</td><td>67.92</td><td>76.54</td></tr>
<tr><td>✓</td><td>✗</td><td>71.83</td><td>80.51</td></tr>
<tr><td><strong>✓</strong></td><td><strong>✓</strong></td><td><strong>73.36</strong></td><td><strong>81.94</strong></td></tr>
</tbody>
</table>
</div>

The two signals are complementary.

SAM produces the larger individual improvement in this ablation, but adding RX on top of SAM produces the strongest full model.

The RX-only row also shows an interesting trade-off: mIoU improves while Dice decreases slightly. That suggests anomaly emphasis can improve spatial precision in some regions while still requiring semantic support to avoid unstable foreground decisions.

## Qualitative effect of SAM and RX

{% include publication-figure.liquid
  src="/assets/img/publications/tinyrxnet/qualitative-ablation.png"
  href="/assets/img/publications/tinyrxnet/qualitative-ablation.png"
  alt="TinyPedSeg qualitative results comparing no SAM or RX, RX without SAM, and full TinyRXNet"
  caption="TinyPedSeg examples comparing the ground truth, the base model, the RX-enhanced model without SAM, and full TinyRXNet."
  credit="Qualitative ablation figure from the manuscript"
  wide=true
%}

Without SAM and RX, the model tends to over-segment and produce large false-positive blobs.

Adding RX makes predictions more selective.

The full model produces more compact masks and better separation of densely grouped tiny pedestrians.

## How local should Local RX be?

Tile size controls the spatial context used to estimate the local background distribution.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>RX tile size</th><th>mIoU</th><th>Dice</th></tr></thead>
<tbody>
<tr><td>16 × 16</td><td>72.83</td><td>81.45</td></tr>
<tr><td><strong>32 × 32</strong></td><td><strong>73.36</strong></td><td><strong>81.94</strong></td></tr>
<tr><td>64 × 64</td><td>69.83</td><td>78.55</td></tr>
<tr><td>128 × 128</td><td>72.92</td><td>81.53</td></tr>
</tbody>
</table>
</div>

The best result occurs at **32 × 32**.

Very small tiles can become sensitive to local noise.

Larger tiles dilute the local context and risk turning the RX score into a more global statistic.

The 32 × 32 setting provides the best balance between neighborhood specificity and covariance stability.

## Why RX is more than attention

It is tempting to describe the RX map as another attention mechanism, but its inductive bias is different.

A learned attention layer asks the network to discover which locations matter from training data.

RX introduces a statistical prior:

> locations that are locally improbable should receive explicit representation.

This makes the mechanism interpretable. The RX map can be inspected directly to see which spatial regions appear anomalous to the network.

That can be valuable in UAV and surveillance applications where understanding why a few-pixel region received attention is useful.

## Limitations and next steps

The current evaluation uses one dataset and one tiny-object category: pedestrians.

The manuscript identifies several natural extensions:

- multi-scale RX with adaptive tile size;
- learnable or differentiable RX statistics;
- other foundation-model feature encoders in place of SAM;
- detection and instance-segmentation variants;
- weakly or semi-supervised settings;
- uncertainty calibration for threshold selection;
- cross-dataset testing across sensors, altitudes, illumination, and additional tiny-object classes.

## Takeaway

TinyRXNet combines two different forms of prior knowledge.

**SAM says:** this region contains semantically meaningful structure.

**Local RX says:** this region is statistically unusual relative to its neighbors.

For tiny-object segmentation, those signals reinforce each other.

The paper's central idea can therefore be summarized as:

> **when an object is too small to dominate the image representation, make its local distinctiveness explicit.**

On TinyPedSeg, combining SAM semantics with Local RX anomaly cues raises segmentation performance to **73.36 mIoU** and **81.94 Dice**, outperforming the evaluated standard segmentation baselines.
