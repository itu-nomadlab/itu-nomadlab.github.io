---
layout: publication
title: "Open-Vocabulary Product Discovery via Fusion Based Visual Retrieval in E-Commerce"
permalink: /publications/open-vocabulary-product-discovery/
publication_id: open-vocabulary-product-discovery
description: "Prompt-driven open-vocabulary product detection combined with dual-view visual retrieval and Freeze-Weighted Reciprocal Rank Fusion."
---

{% include publication-figure.liquid
  src="/assets/img/publications/open-vocabulary-product-discovery/pipeline.png"
  href="/assets/img/publications/open-vocabulary-product-discovery/pipeline.png"
  alt="Open-vocabulary visual shopping pipeline using YOLO-World, product and scene embeddings, and FWRRF"
  caption="The visual-shopping pipeline: YOLO-World detects prompted products, product and scene views are embedded separately, and Freeze-Weighted Reciprocal Rank Fusion combines the two retrieval lists."
  credit="Figure 3 from the paper"
  wide=true
%}

<p class="publication-summary__lede">
Traditional “shop the look” systems are powerful but expensive to maintain: every new product category may require new annotations, detector retraining, and retrieval-model updates. This work asks whether visual product discovery can be made <strong>category-flexible</strong> instead. The proposed pipeline uses <strong>YOLO-World</strong> for prompt-driven open-vocabulary detection and combines object-centric and scene-level retrieval through a lightweight <strong>Freeze-Weighted Reciprocal Rank Fusion (FWRRF)</strong> rule—without fine-tuning the neural backbones.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Detection</span><strong>YOLO-World</strong></div>
  <div class="publication-summary__fact"><span>Categories</span><strong>10 living-room classes</strong></div>
  <div class="publication-summary__fact"><span>Detection data</span><strong>4,442 images</strong></div>
  <div class="publication-summary__fact"><span>Retrieval views</span><strong>Product + Scene</strong></div>
  <div class="publication-summary__fact"><span>Fusion</span><strong>FWRRF</strong></div>
  <div class="publication-summary__fact"><span>Fine-tuning</span><strong>None</strong></div>
</div>

## From fixed catalogs to prompt-driven discovery

A conventional e-commerce visual-search system usually knows a fixed taxonomy. If a marketplace introduces a new class, a category-specific detector may need new bounding-box annotations and another training cycle.

Open-vocabulary detection changes that interface. Instead of hard-coding a detector around a closed class list, the detector receives natural-language prompts such as:

- `sofa`
- `armchair`
- `coffee table`
- `living room decor plant`
- `hanging lamp`

The system can therefore expand its detection vocabulary through text rather than by retraining a category-specific detector.

## The living-room detection benchmark

The object-detection dataset contains 4,442 e-commerce images covering ten living-room categories.

{% include publication-figure.liquid
  src="/assets/img/publications/open-vocabulary-product-discovery/object-categories.png"
  href="/assets/img/publications/open-vocabulary-product-discovery/object-categories.png"
  alt="Ten living-room product categories used in the object-detection benchmark"
  caption="The ten product categories used to benchmark open-vocabulary detection."
  credit="Figure 1 from the paper"
  wide=true
%}

The dataset is split 70% / 10% / 20% for training, validation, and testing. The supervised YOLOv11 baseline uses this labeled training set, while YOLO-World is evaluated as an open-vocabulary detector.

## Query and gallery construction

The retrieval dataset is created from automatically annotated products.

For each product identity, the first image is used as a query and the remaining images are placed in the gallery.

{% include publication-figure.liquid
  src="/assets/img/publications/open-vocabulary-product-discovery/query-gallery.png"
  href="/assets/img/publications/open-vocabulary-product-discovery/query-gallery.png"
  alt="Examples of query images and gallery images used for product retrieval"
  caption="Query/gallery construction for the visual product retrieval benchmark."
  credit="Figure 2 from the paper"
  wide=true
%}

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Split</th><th>Query products</th><th>Gallery products</th><th>Query images</th><th>Gallery images</th></tr>
</thead>
<tbody>
<tr><td>Validation</td><td>1,983</td><td>1,983</td><td>1,983</td><td>4,066</td></tr>
<tr><td>Test</td><td>9,312</td><td>9,312</td><td>9,312</td><td>20,523</td></tr>
</tbody>
</table>
</div>

The validation split is used to tune only prompts and fusion hyperparameters. The test split is held out for final evaluation.

## Step 1: open-vocabulary detection

The paper benchmarks several open-vocabulary detectors:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Detector</th><th>Validation mAP@0.5</th></tr></thead>
<tbody>
<tr><td>Kosmos-2</td><td>0.121</td></tr>
<tr><td>Grounding DINO-Tiny</td><td>0.135</td></tr>
<tr><td>Grounding DINO-Base</td><td>0.149</td></tr>
<tr><td>OWL</td><td>0.429</td></tr>
<tr><td>OWLv2</td><td>0.499</td></tr>
<tr><td><strong>YOLO-World-L</strong></td><td><strong>0.789</strong></td></tr>
</tbody>
</table>
</div>

YOLO-World-L is the strongest open-vocabulary detector in the validation comparison and becomes the detection backbone for the retrieval pipeline.

## Prompt engineering instead of detector retraining

Because open-vocabulary detection depends on text, wording matters.

The paper tests alternative prompts for each class and selects the best validation phrase. Several categories benefit substantially from a more descriptive prompt.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Class</th><th>Generic prompt</th><th>Selected prompt</th><th>Selected AP@0.5</th></tr></thead>
<tbody>
<tr><td>Center table</td><td>Center Table</td><td><strong>Coffee Table</strong></td><td>0.905</td></tr>
<tr><td>Indoor plant</td><td>Indoor Plant</td><td><strong>Living Room Decor Plant</strong></td><td>0.933</td></tr>
<tr><td>Floor lamp</td><td>Floor Lamp</td><td><strong>Floor Lamp Stand</strong></td><td>0.818</td></tr>
<tr><td>Armchair</td><td>Armchair</td><td><strong>Armchair</strong></td><td>0.812</td></tr>
<tr><td>Art print</td><td>Art Print</td><td><strong>Framed Canvas Art Print</strong></td><td>0.834</td></tr>
<tr><td>Pendant lamp</td><td>Pendant Lamp</td><td><strong>Hanging Lamp</strong></td><td>0.653</td></tr>
</tbody>
</table>
</div>

On the held-out test set:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Detector</th><th>Test mAP@0.5</th></tr></thead>
<tbody>
<tr><td>Kosmos-2</td><td>0.107</td></tr>
<tr><td>Grounding DINO-Tiny</td><td>0.135</td></tr>
<tr><td>Grounding DINO-Base</td><td>0.156</td></tr>
<tr><td>OWL</td><td>0.478</td></tr>
<tr><td>OWLv2</td><td>0.675</td></tr>
<tr><td>YOLO-World-L, untuned</td><td>0.796</td></tr>
<tr><td>YOLOv11, supervised</td><td>0.810</td></tr>
<tr><td><strong>YOLO-World-L, prompt-tuned</strong></td><td><strong>0.851</strong></td></tr>
</tbody>
</table>
</div>

The important comparison is that an untuned open-vocabulary detector already approaches the fully supervised YOLOv11 baseline, while prompt selection raises the open-vocabulary result to **0.851 mAP@0.5**.

No detector weights are fine-tuned for this improvement.

## Step 2: two representations of the same product

After detection, the retrieval system keeps two views.

### Product view

The detected crop isolates the product and emphasizes shape, texture, and object-specific appearance.

### Scene view

The full image retains room context: surrounding furniture, layout, lighting, and decor.

For each view \(v \in \{P,S\}\),

$$
z^{(v)} = f_v(x) \in \mathbb{R}^{d}.
$$

All embedding backbones are frozen.

The key hypothesis is that the two views are complementary: product crops are better for exact visual similarity, while scenes can rescue ambiguous cases in which context matters.

## Product-view retrieval

Across the evaluated embedding backbones, Barlow Twins is strongest on product crops.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Backbone</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th></tr></thead>
<tbody>
<tr><td>EfficientNetB4</td><td>0.479</td><td>0.582</td><td>0.619</td><td>0.659</td></tr>
<tr><td>CLIP</td><td>0.498</td><td>0.596</td><td>0.632</td><td>0.673</td></tr>
<tr><td>ResNeXt101</td><td>0.523</td><td>0.622</td><td>0.653</td><td>0.702</td></tr>
<tr><td>ResNet50</td><td>0.535</td><td>0.644</td><td>0.680</td><td>0.734</td></tr>
<tr><td>SwAV</td><td>0.544</td><td>0.650</td><td>0.684</td><td>0.732</td></tr>
<tr><td>EfficientNetB1</td><td>0.549</td><td>0.655</td><td>0.691</td><td>0.733</td></tr>
<tr><td><strong>Barlow Twins</strong></td><td><strong>0.564</strong></td><td><strong>0.671</strong></td><td><strong>0.708</strong></td><td><strong>0.751</strong></td></tr>
</tbody>
</table>
</div>

## Scene-view retrieval

Scene embeddings are weaker in isolation but still carry useful complementary context.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Backbone</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th></tr></thead>
<tbody>
<tr><td>EfficientNetB4</td><td>0.385</td><td>0.481</td><td>0.523</td><td>0.570</td></tr>
<tr><td>ResNeXt101</td><td>0.414</td><td>0.518</td><td>0.566</td><td>0.622</td></tr>
<tr><td>SwAV</td><td>0.430</td><td>0.563</td><td>0.604</td><td>0.653</td></tr>
<tr><td>ResNet50</td><td>0.435</td><td>0.551</td><td>0.600</td><td>0.657</td></tr>
<tr><td>CLIP</td><td>0.441</td><td>0.565</td><td>0.610</td><td>0.646</td></tr>
<tr><td>EfficientNetB1</td><td>0.455</td><td>0.576</td><td>0.621</td><td>0.680</td></tr>
<tr><td><strong>Barlow Twins</strong></td><td><strong>0.465</strong></td><td><strong>0.594</strong></td><td><strong>0.641</strong></td><td><strong>0.690</strong></td></tr>
</tbody>
</table>
</div>

Because Barlow Twins leads both modalities, the final fusion experiment uses Barlow Twins for the product and scene views.

## Step 3: Freeze-Weighted Reciprocal Rank Fusion

A standard fusion rule can reorder even the most reliable top product matches. FWRRF prevents this by **freezing** a small prefix of the object-centric ranking before fusing the remaining candidates.

If \(r_P(d)\) is the product-view rank of item \(d\), the frozen set is

$$
\mathcal{F}
=
\{d \mid r_P(d) < N_{\mathrm{keep}}\}.
$$

Candidates outside the frozen prefix receive a weighted reciprocal-rank score:

$$
\mathrm{score}(d)
=
\frac{w_{\mathrm{product}}}
{k_{\mathrm{rrf}} + r_{\mathrm{product}}(d)+1}
+
\frac{w_{\mathrm{scene}}}
{k_{\mathrm{rrf}} + r_{\mathrm{scene}}(d)+1}.
$$

The final ranking concatenates the fixed product prefix with the remaining items sorted by fused score.

The design therefore encodes a deliberate asymmetry:

> trust the strongest object-centric result, then let scene context help reorder what follows.

## Fusion hyperparameters

The validation search optimizes:

- \(w_{\mathrm{product}}\)
- \(w_{\mathrm{scene}}\)
- \(k_{\mathrm{rrf}}\)
- \(N_{\mathrm{keep}}\)

for Recall@3.

The selected configuration is

$$
w_{\mathrm{product}}=1.0,
\qquad
w_{\mathrm{scene}}=1.0,
\qquad
k_{\mathrm{rrf}}=0,
\qquad
N_{\mathrm{keep}}=1.
$$

This means the highest-ranked product-view result is preserved, while the remaining ranking is determined by equal-weight product and scene reciprocal ranks.

## Does fusion help?

Yes—primarily beyond rank one.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Method</th><th>Split</th><th>R@1</th><th>R@3</th><th>R@5</th><th>R@10</th></tr>
</thead>
<tbody>
<tr><td>Scene</td><td>Validation</td><td>0.465</td><td>0.594</td><td>0.641</td><td>0.690</td></tr>
<tr><td>Scene</td><td>Test</td><td>0.332</td><td>0.456</td><td>0.505</td><td>0.566</td></tr>
<tr><td>Product</td><td>Validation</td><td>0.564</td><td>0.671</td><td>0.708</td><td>0.751</td></tr>
<tr><td>Product</td><td>Test</td><td>0.407</td><td>0.538</td><td>0.584</td><td>0.638</td></tr>
<tr><td><strong>FWRRF</strong></td><td><strong>Validation</strong></td><td><strong>0.564</strong></td><td><strong>0.708</strong></td><td><strong>0.755</strong></td><td><strong>0.796</strong></td></tr>
<tr><td><strong>FWRRF</strong></td><td><strong>Test</strong></td><td><strong>0.407</strong></td><td><strong>0.580</strong></td><td><strong>0.634</strong></td><td><strong>0.689</strong></td></tr>
</tbody>
</table>
</div>

The frozen prefix explains why R@1 is unchanged from the product-only model. The improvement appears at deeper ranks:

- Test R@3: **0.538 → 0.580**
- Test R@5: **0.584 → 0.634**
- Test R@10: **0.638 → 0.689**

The fusion layer therefore preserves the strongest object-centric first result while using scene context to improve the rest of the shortlist.

## What does that look like?

{% include publication-figure.liquid
  src="/assets/img/publications/open-vocabulary-product-discovery/qualitative-retrieval.png"
  href="/assets/img/publications/open-vocabulary-product-discovery/qualitative-retrieval.png"
  alt="Qualitative examples comparing scene retrieval, product retrieval, and FWRRF"
  caption="Scene-only, product-only, and FWRRF retrieval for two queries. Green boxes mark correct product matches."
  credit="Figure 4 from the paper"
  wide=true
%}

The examples illustrate why one representation is not universally sufficient. Scene similarity can introduce contextual bias, while product crops can lose information when detection is imperfect. FWRRF uses both while protecting the most reliable object-centric top result.

## A system designed for category expansion

The main contribution is not a new end-to-end neural model.

All neural backbones remain frozen.

Adaptation happens through:

1. changing the text prompts supplied to the open-vocabulary detector;
2. choosing which frozen embedding models to use;
3. adjusting a small number of rank-fusion hyperparameters.

That is what makes the pipeline attractive for a changing product catalog: adding a category does not necessarily imply another annotation-and-retraining cycle.

## Limitations

The paper identifies several directions where the system can still improve.

### Color sensitivity

Visual embeddings often emphasize shape more strongly than color, causing errors between structurally similar products.

### Scene bias

Full-scene embeddings may retrieve visually similar rooms rather than the correct object.

### Detection edge cases

Closely packed objects and objects filling most of the frame can cause duplicate or imperfect detections.

### Heuristic fusion

FWRRF is intentionally lightweight. A trainable or attention-based fusion model could adapt the balance between product and scene evidence more flexibly.

## Takeaway

The paper combines two ideas that make visual shopping easier to scale:

- **open-vocabulary detection** replaces category-specific detector retraining with text prompts;
- **dual-view rank fusion** combines the precision of object crops with the context of full scenes.

The most interesting engineering choice is the “freeze” in FWRRF:

> **preserve what the object view is already highly confident about, then let context improve the remainder of the ranking.**

With prompt-tuned YOLO-World reaching **0.851 mAP@0.5** and FWRRF reaching **Recall@3 = 0.580** on the held-out retrieval test split, the paper shows that a large part of a visual-shopping pipeline can adapt through prompts and ranking logic rather than network retraining.
