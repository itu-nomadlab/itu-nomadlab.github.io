---
layout: publication
title: "The Past Informs the Future: Temporal Sliding Window Graph Attention Networks for Real-Time Football Match Outcome Prediction"
permalink: /publications/temporal-sliding-window-gat/
publication_id: temporal-sliding-window-gat
description: "A temporal graph-attention framework that combines cumulative passing structure with recent interval-specific dynamics for real-time football match outcome prediction."
---

{% include publication-figure.liquid
  src="/assets/img/publications/temporal-sliding-window-gat/architecture.png"
  href="/assets/img/publications/temporal-sliding-window-gat/architecture.png"
  alt="Architecture of the Temporal Sliding Window Graph Attention Network"
  caption="TSW-GAT combines cumulative pass networks with interval-specific graphs and window-level in-game features for home-win, draw, and away-win prediction."
  credit="Architecture figure rendered directly from the manuscript's TikZ source"
  wide=true
%}

<p class="publication-summary__lede">
Football does not evolve as a single static network. A team's passing structure at minute 90 contains the history of the match, but that history can hide the tactical change that happened five minutes ago. <strong>TSW-GAT</strong> therefore models two views at the same time: a cumulative graph that remembers the match so far, and a set of recent interval graphs that capture momentum, tactical adjustment, and short-lived interaction patterns.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Training corpus</span><strong>2,806 English matches</strong></div>
  <div class="publication-summary__fact"><span>Prediction times</span><strong>45 / 60 / 75 / 90 min</strong></div>
  <div class="publication-summary__fact"><span>Graph model</span><strong>3-layer GAT</strong></div>
  <div class="publication-summary__fact"><span>Graph embedding</span><strong>128 dimensions</strong></div>
  <div class="publication-summary__fact"><span>Half-time accuracy</span><strong>77.94%</strong></div>
  <div class="publication-summary__fact"><span>Full-time accuracy</span><strong>81.85%</strong></div>
</div>

## Why cumulative graphs are not enough

A cumulative passing graph is useful because it encodes the stable tactical structure that has emerged from kickoff to the current prediction minute. But every new pass is added to the same network. As the match progresses, recent tactical changes are diluted by everything that happened before them.

TSW-GAT keeps that long-term representation, but supplements it with a sequence of interval-specific graphs covering the most recent windows before time $t$.

For example, when $k=2$ and $N=15$ at minute 90, the model sees:

- one cumulative graph over $[0,90]$;
- one recent graph over $[60,75)$;
- one recent graph over $[75,90)$.

The model can therefore ask two different questions simultaneously: **what has this team looked like over the whole match?** and **what is it doing right now?**

## Building the temporal graphs

Each team's cumulative graph uses seven node features:

$$
\mathbf{x}_i^{\mathrm{cmltv}}
=
[\mathrm{position},\mathrm{height},\mathrm{weight},\mathrm{rating},\mathrm{pass\ accuracy},\mathrm{avg\ x},\mathrm{avg\ y}].
$$

The interval graphs intentionally remove the player rating:

$$
\mathbf{x}_i^{\mathrm{int}}
=
[\mathrm{position},\mathrm{height},\mathrm{weight},\mathrm{pass\ accuracy},\mathrm{avg\ x},\mathrm{avg\ y}].
$$

The exclusion matters because the interval representation is supposed to describe what happened **inside that local time window**. Pass accuracy and average pitch position are recomputed from the events in the interval itself.

In parallel, every cumulative or interval window receives **22 in-game features**: 16 event-count statistics and six event-derived indicators including pass-success rate, final-third passes, crosses, key passes, big chances, and shot assists.

## Shared temporal graph encoder

Each graph is passed through a three-layer Graph Attention Network:

$$
\mathbf{h}_i^{(l)}
=
\mathrm{Dropout}
\left(
\mathrm{ELU}
\left(
\mathrm{GATConv}^{(l)}
(\mathbf{h}_i^{(l-1)},\mathcal{N}(i))
\right)
\right),
\qquad l=1,2,3.
$$

Global mean pooling converts the node-level output into a fixed $128$-dimensional graph representation.

There are two graph encoders:

- $\mathrm{GAT}_{\mathrm{cmltv}}$ processes the cumulative graph;
- $\mathrm{GAT}_{\mathrm{int}}$ processes every interval graph with **shared weights**.

Shared interval weights are important: the same temporal feature extractor must recognise meaningful patterns regardless of whether a window occurs early or late in the match.

## Fusion across teams and time

Graph embeddings for the home and away teams are concatenated with the corresponding 22-dimensional in-game feature vectors.

For $k=2$:

$$
128(1+k)\times2 = 768
$$

graph dimensions and

$$
22(1+k)\times2 = 132
$$

hand-crafted in-game dimensions combine into a **900-dimensional fusion vector**. A fully connected fusion layer reduces this to 128 dimensions before the final three-way classifier outputs:

$$
\text{Home Win}\quad |\quad \text{Draw}\quad |\quad \text{Away Win}.
$$

## The optimal window changes with match time

One of the clearest findings is that there is no single best temporal window configuration for the entire match.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Prediction time</th><th>$k$</th><th>$N$</th><th>Accuracy</th><th>Macro F1</th></tr>
</thead>
<tbody>
<tr><td>45 min</td><td>1</td><td>3</td><td><strong>77.94%</strong></td><td>0.76</td></tr>
<tr><td>60 min</td><td>1</td><td>3</td><td><strong>78.47%</strong></td><td>0.77</td></tr>
<tr><td>75 min</td><td>2</td><td>10</td><td><strong>80.96%</strong></td><td>0.79</td></tr>
<tr><td>90 min</td><td>2</td><td>15</td><td><strong>81.85%</strong></td><td>0.81</td></tr>
</tbody>
</table>
</div>

Early prediction benefits from **short, highly local windows**. Later in the match, the best configuration expands its temporal context. In other words, the amount of recent history that is useful to the model changes as the match itself matures.

## The largest gain arrives when evidence is scarce

The paper compares TSW-GAT with the cumulative GAT baseline of Lee et al.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Model</th><th>45 min</th><th>60 min</th><th>75 min</th><th>90 min</th></tr>
</thead>
<tbody>
<tr><td>Cumulative GAT baseline</td><td>57.36</td><td>63.56</td><td>75.22</td><td><strong>83.09</strong></td></tr>
<tr><td><strong>TSW-GAT</strong></td><td><strong>77.94</strong></td><td><strong>78.47</strong></td><td><strong>80.96</strong></td><td>81.85</td></tr>
<tr><td>Difference</td><td><strong>+20.58</strong></td><td>+14.91</td><td>+5.74</td><td>−1.24</td></tr>
</tbody>
</table>
</div>

The advantage is greatest at halftime, when the cumulative graph has the least evidence. By minute 90, the cumulative baseline has absorbed almost the entire match and the gap disappears. This is exactly the regime the sliding-window formulation was designed to address.

## Substitutions change the network itself

A football pass network is not structurally fixed. Players leave the pitch; replacements enter; red cards alter team composition.

The paper therefore evaluates a substitution-aware variant that updates interval-graph node sets according to substitutions and dismissals.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Minute</th><th>Base model</th><th>Substitution-aware</th><th>Difference</th></tr>
</thead>
<tbody>
<tr><td>45</td><td>77.94%</td><td>77.22%</td><td>−0.72</td></tr>
<tr><td>60</td><td>78.47%</td><td><strong>79.89%</strong></td><td><strong>+1.42</strong></td></tr>
<tr><td>75</td><td>80.96%</td><td>79.89%</td><td>−1.07</td></tr>
<tr><td>90</td><td>81.85%</td><td>81.14%</td><td>−0.71</td></tr>
</tbody>
</table>
</div>

The gain is targeted rather than universal. The strongest improvement appears at minute 60, a period in which tactical substitutions begin to materially change the on-field network.

## Does the model generalise across leagues?

TSW-GAT is trained on English Premier League and Championship matches and then evaluated without retraining on Bundesliga, La Liga, Ligue 1, and Serie A.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>League</th><th>45-min accuracy</th><th>90-min accuracy</th></tr>
</thead>
<tbody>
<tr><td>Bundesliga</td><td>58.6%</td><td><strong>85.0%</strong></td></tr>
<tr><td>La Liga</td><td>54.9%</td><td>84.7%</td></tr>
<tr><td>Ligue 1</td><td>56.1%</td><td>84.1%</td></tr>
<tr><td>Serie A</td><td>55.0%</td><td>83.1%</td></tr>
<tr><td><strong>Average</strong></td><td><strong>56.2%</strong></td><td><strong>84.2%</strong></td></tr>
</tbody>
</table>
</div>

The contrast is striking: early-match representations are highly league-specific, while late-match passing patterns generalise far better. This suggests that the tactical language of the opening phases differs across competitions, but as outcome pressure rises, the structural signals associated with winning and losing become more universal.

## What does TSW-GAT actually look at?

The manuscript goes beyond accuracy and asks which in-game features drive the prediction over different temporal windows.

{% include publication-figure.liquid
  src="/assets/img/publications/temporal-sliding-window-gat/feature-heatmap.png"
  href="/assets/img/publications/temporal-sliding-window-gat/feature-heatmap.png"
  alt="Feature attribution heatmap across interval and cumulative windows"
  caption="Input×Gradient attribution for the winning team across two late-match interval windows and the cumulative window."
  credit="Figure from the manuscript"
  wide=true
%}

The cumulative representation focuses strongly on **pass success rate** and **saved shots**, while recent windows shift toward signals such as **ball touches**, **key passes**, and **blocked passes**. The model is therefore not simply repeating the same decision rule at every time scale.

## Direction matters, not only magnitude

A feature can be important while supporting or opposing the predicted class. The directional attribution figure separates these effects.

{% include publication-figure.liquid
  src="/assets/img/publications/temporal-sliding-window-gat/directional-attribution.png"
  href="/assets/img/publications/temporal-sliding-window-gat/directional-attribution.png"
  alt="Directional feature attributions for winning and losing teams"
  caption="Signed feature attribution comparison between the predicted winning and losing teams."
  credit="Figure from the manuscript"
  wide=true
%}

A particularly interesting pattern is that **dispossessions** can support a win prediction while **interceptions** and **tackles** support the losing side. At event level this sounds counterintuitive. At team level it is coherent: a possession-dominant team has more opportunities to be dispossessed, while a team recording many defensive interventions is often reacting to sustained opponent possession.

## The graph attention itself changes over time

The final explainability figure visualises edge importance for two late intervals and the full cumulative graph.

{% include publication-figure.liquid
  src="/assets/img/publications/temporal-sliding-window-gat/edge-importance.jpeg"
  href="/assets/img/publications/temporal-sliding-window-gat/edge-importance.jpeg"
  alt="Edge importance across 60–75, 75–90, and cumulative football passing graphs"
  caption="Gradient-based edge importance across interval and cumulative pass networks."
  credit="Figure from the manuscript"
  wide=true
%}

The cumulative graph emphasises stable short build-up connections. The late-game interval graphs increasingly emphasise longer vertical progression. That shift fits football intuition: as teams chase or defend a result, direct transitions become more consequential.

## Takeaway

TSW-GAT's central contribution is not merely adding more graphs. It gives the model **multiple temporal memories**.

The cumulative graph preserves stable team structure. The interval graphs expose tactical change before it is washed out by the rest of the match. Shared graph-attention encoders learn comparable local representations across windows, while the fusion layer combines them with conventional event statistics.

The result is most valuable precisely when the future is still uncertain: at halftime, temporal decomposition produces a **20.58 percentage-point** gain over the cumulative-only comparison. Later, as more evidence accumulates, broader windows become useful and cross-league performance converges toward strong full-time accuracy.

The past informs the future—but the **recent past should not be averaged away**.
