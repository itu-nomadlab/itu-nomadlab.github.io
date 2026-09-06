---
layout: publication
title: "How Do Football Teams Play? An Extended DEC Analysis to Uncover Playing Styles"
permalink: /publications/football-playing-styles-dec/
publication_id: football-playing-styles-dec
description: "An extended phase-aware DEC analysis of football playing styles with temporal adaptation, interpretability, cross-phase coherence, holistic tactical archetypes, and frozen-model robustness."
---

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/pipeline.png"
  href="/assets/img/publications/football-playing-styles-dec/pipeline.png"
  alt="Extended phase-aware DEC methodology and analysis pipeline"
  caption="The extended pipeline adds 15-minute temporal windows, interpretability, tactical adaptation analysis, frozen-model evaluation, and holistic cross-phase archetypes to the original phase-wise DEC framework."
  credit="Figure 1 from the journal article"
  wide=true
%}

<p class="publication-summary__lede">
The conference version asked whether Deep Embedded Clustering could discover meaningful football playing styles. The journal extension asks a harder set of questions: <strong>Why does a team belong to a style? Does that style change during a match? Are those changes associated with outcomes? Do attacking and defensive identities remain coherent across phases? And do the learned representations survive temporal distribution shift?</strong>
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Events</span><strong>3M+</strong></div>
  <div class="publication-summary__fact"><span>Matches</span><strong>1,826</strong></div>
  <div class="publication-summary__fact"><span>Game phases</span><strong>4</strong></div>
  <div class="publication-summary__fact"><span>Temporal view</span><strong>6 × 15 min</strong></div>
  <div class="publication-summary__fact"><span>Phase styles</span><strong>k = 4</strong></div>
  <div class="publication-summary__fact"><span>Holistic archetypes</span><strong>16</strong></div>
</div>

## What is actually extended?

The journal version retains the phase-specific DEC core but expands it in four directions.

1. **Temporal adaptation.** Match events are additionally aggregated into fixed 15-minute windows, allowing style switching to be studied within matches rather than only across a season.
2. **Interpretability.** Feature-group ablation, supervised surrogate models, and SHAP connect the latent DEC clusters back to observable football behavior.
3. **Cross-phase coherence.** In-Possession is linked to Positive Transition, and Out-of-Possession to Negative Transition, to test whether teams preserve their tactical identity as possession state changes.
4. **Temporal robustness.** Models learned on first-half matches are frozen and applied directly to second-half data without retraining.

The result is no longer just a clustering pipeline. It becomes a framework for studying **identity, adaptation, explanation, coherence, and robustness**.

## The phase-aware DEC core

The underlying dataset remains the 2016–17 season across the top leagues of England, Spain, Italy, Germany, and France.

Every team-match is represented independently in four possession-driven phases:

- In-Possession (IP)
- Out-of-Possession (OP)
- Positive Transition (PT)
- Negative Transition (NT)

This yields **3,652 team-match observations per phase**.

The engineered features combine:

- three-zone spatial information;
- pass direction, length, and height;
- pass motifs such as ABAB and ABCD;
- passing-network connectivity;
- shots and shot distance;
- duels, fouls, runs, clearances, and accelerations.

There are **30 attacking-phase features** and **45 defensive-phase features**.

DEC learns a 10-dimensional latent representation and refines cluster assignments using a KL-divergence objective. A separate model is trained for every game phase.

## A broader and more stable clustering benchmark

The extended paper broadens the baseline set beyond K-Means, K-Medoids, and Ward clustering by adding **Gaussian Mixture Models** and **Spectral Clustering**.

Every experiment is repeated across **five random seeds**, and the journal version additionally reports NMI across initializations as a measure of cluster stability.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/clustering-performance.png"
  href="/assets/img/publications/football-playing-styles-dec/clustering-performance.png"
  alt="Clustering performance across k for In-Possession and Out-of-Possession"
  caption="DEC remains the strongest method across the tested cluster counts for In-Possession and Out-of-Possession. Results are averaged over five random seeds."
  credit="Figure 2 from the journal article"
  wide=true
%}

The extended sensitivity analysis reveals an important trade-off:

- lower $k$ often maximizes pure Silhouette separation;
- $k=3$ or $k=4$ tends to maximize the composite tactical agreement metrics;
- stability patterns differ by game phase.

The authors retain **$k=4$ for phase-level styles** because it balances clustering quality, stability, interpretability, and comparability across phases.

For the later cross-phase synthesis, the representation is intentionally coarsened to **$k=2$ per phase**, producing $2^4=16$ possible holistic archetypes.

## The four In-Possession identities remain interpretable

The phase-level In-Possession analysis retains four familiar styles:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Style</th><th>Passes / 90</th><th>High-pass ratio</th><th>Shots / 90</th><th>Connectivity</th><th>ABCB frequency</th></tr>
</thead>
<tbody>
<tr><td><strong>Reactive Direct</strong></td><td>302.7</td><td>0.21</td><td>9.1</td><td>6.7</td><td>0.087</td></tr>
<tr><td><strong>Highly Proactive</strong></td><td>576.9</td><td>0.10</td><td>14.3</td><td>8.1</td><td>0.098</td></tr>
<tr><td><strong>Moderately Reactive</strong></td><td>375.8</td><td>0.18</td><td>10.1</td><td>7.3</td><td>0.093</td></tr>
<tr><td><strong>Balanced Proactive</strong></td><td>453.9</td><td>0.14</td><td>10.8</td><td>7.7</td><td>0.096</td></tr>
</tbody>
</table>
</div>

The journal extension then asks whether those labels can be explained from the original event features.

## Which feature groups actually create the styles?

The most revealing interpretability result comes from feature-group ablation.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>Setting</th><th>NMI</th><th>ARI</th><th>Team stability</th><th>Silhouette</th><th>AC1</th><th>AC2</th></tr>
</thead>
<tbody>
<tr><td><strong>Full model</strong></td><td>1.00</td><td>1.00</td><td>1.00</td><td>0.95</td><td>0.99</td><td>0.98</td></tr>
<tr><td>w/o Spatial Passing Risk Profile</td><td>0.25</td><td>0.21</td><td>0.18</td><td>0.90</td><td>0.01</td><td>0.01</td></tr>
<tr><td>w/o Shooting Volume & Shot Selection</td><td>0.49</td><td>0.46</td><td>0.22</td><td>0.91</td><td>0.21</td><td>0.18</td></tr>
<tr><td>w/o Passing Volume & Network</td><td>0.40</td><td>0.35</td><td>0.08</td><td>0.93</td><td>0.59</td><td>0.62</td></tr>
<tr><td>w/o Passing Directionality</td><td>0.44</td><td>0.40</td><td>0.29</td><td>0.94</td><td>0.65</td><td>0.77</td></tr>
<tr><td>w/o Passing Motifs</td><td>0.45</td><td>0.41</td><td>0.14</td><td>0.94</td><td>0.77</td><td>0.80</td></tr>
</tbody>
</table>
</div>

Removing the **Spatial Passing Risk Profile** causes the largest collapse. Spatially conditioned high/low pass behavior is therefore not a cosmetic descriptor—it is one of the core dimensions separating tactical styles.

Shooting behavior is the second-most important family, while pass motifs contribute useful detail but are less dominant than spatial risk, circulation volume, or directional intent.

## Can a simple model recover the DEC clusters?

To connect the latent representation back to observable football metrics, the paper trains supervised surrogate models to predict the DEC cluster labels.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Surrogate</th><th>Accuracy</th><th>Macro-F1</th></tr></thead>
<tbody>
<tr><td><strong>Multinomial logistic regression</strong></td><td><strong>0.945</strong></td><td><strong>0.944</strong></td></tr>
<tr><td>XGBoost</td><td>0.911</td><td>0.911</td></tr>
<tr><td>LightGBM</td><td>0.893</td><td>0.893</td></tr>
</tbody>
</table>
</div>

The surprisingly strong logistic-regression result is useful: DEC improves the clustering geometry, but the resulting styles remain largely expressible through recognizable football variables.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/feature-importance.png"
  href="/assets/img/publications/football-playing-styles-dec/feature-importance.png"
  alt="Global feature importance of the logistic regression surrogate"
  caption="Global feature importance from the multinomial logistic-regression surrogate. Passing volume, forward/side-pass tendencies, spatial passing risk, and network connectivity dominate."
  credit="Figure 3 from the journal article"
%}

## SHAP: what drives each style?

The surrogate model is then explained with SHAP.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/shap-reactive.png"
  href="/assets/img/publications/football-playing-styles-dec/shap-reactive.png"
  alt="SHAP beeswarm plots for Reactive Direct and Moderately Reactive styles"
  caption="Feature contributions for the Reactive Direct and Moderately Reactive styles."
  credit="Figure 4 from the journal article"
  wide=true
%}

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/shap-proactive.png"
  href="/assets/img/publications/football-playing-styles-dec/shap-proactive.png"
  alt="SHAP beeswarm plots for Balanced Proactive and Highly Proactive styles"
  caption="Feature contributions for the Balanced Proactive and Highly Proactive styles."
  credit="Figure 5 from the journal article"
  wide=true
%}

The interpretation forms a clear **possession–directness continuum**.

- Highly Proactive teams are pushed toward their cluster by high pass volume and strong network connectivity.
- Reactive Direct teams are associated with lower circulation and stronger forward/high-pass tendencies.
- Balanced Proactive preserves the possession signal with lower magnitude.
- Moderately Reactive occupies the less extreme middle of the representation.

The latent clusters therefore correspond to coherent, inspectable football behavior rather than opaque embedding artifacts.

## Style effectiveness still matters

The extended paper retains outcome-based validation.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/win-heatmap.png"
  href="/assets/img/publications/football-playing-styles-dec/win-heatmap.png"
  alt="Pairwise win percentages between playing-style clusters"
  caption="Pairwise win percentages between the four In-Possession styles."
  credit="Figure 6 from the journal article"
%}

The more stylistically specialized ends of the attacking spectrum tend to outperform the intermediate profiles. In particular, Highly Proactive and Reactive Direct identities remain competitively meaningful rather than merely geometrically distinct clusters.

## Does changing style across a season help?

The journal version introduces six fixed match windows:

$$
0\text{–}15,\;
15\text{–}30,\;
30\text{–}45,\;
45\text{–}60,\;
60\text{–}75,\;
75\text{–}90+.
$$

At the season level, a team's dominant style is estimated for each window and the number of transitions across windows is counted.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/team-style-stability.png"
  href="/assets/img/publications/football-playing-styles-dec/team-style-stability.png"
  alt="Season win-rate distributions by team-level style change count"
  caption="Season win rate versus team-level style-change frequency. No clear monotonic relationship emerges."
  credit="Figure 7 from the journal article"
%}

There is **no significant monotonic relationship** between team-level style-change frequency and season win rate:

- Spearman $\rho=-0.17$, $p=0.10$;
- rigid vs. switching teams: Mann–Whitney $p=0.24$.

Season-long tactical flexibility, by itself, is therefore not evidence of greater success.

## Within a match, the story changes

At the match level, the association is much clearer.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Analysis</th><th>Estimate</th><th>Significance</th></tr></thead>
<tbody>
<tr><td>Overall loss rate</td><td>0.376</td><td>—</td></tr>
<tr><td>Loss rate, 0 switches</td><td>0.272</td><td>—</td></tr>
<tr><td>Loss rate, &gt;0 switches</td><td>0.382</td><td>—</td></tr>
<tr><td>Spearman: switches vs. loss</td><td>0.17</td><td><strong>p &lt; 0.001</strong></td></tr>
<tr><td>Mann–Whitney: 0 vs. &gt;0</td><td>—</td><td><strong>p = 0.001</strong></td></tr>
<tr><td>Logit, unadjusted</td><td>OR = 1.17</td><td><strong>p &lt; 0.001</strong></td></tr>
<tr><td>Logit, controlling for season win rate</td><td>OR = 1.11</td><td><strong>p &lt; 0.001</strong></td></tr>
</tbody>
</table>
</div>

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/style-switch-loss.png"
  href="/assets/img/publications/football-playing-styles-dec/style-switch-loss.png"
  alt="Empirical and predicted loss probabilities by within-match style switches"
  caption="Loss probability rises with the number of within-match style switches; the relationship remains significant after controlling for team strength."
  credit="Figure 8 from the journal article"
  wide=true
%}

The empirical loss rate rises from **27.2% with no switches** to **more than 44% with five switches**.

This does **not** establish causality. Frequent switching may be a response to an already unfavorable match state rather than the cause of the loss. The paper explicitly treats the result as an association.

## How styles evolve over 90 minutes

The temporal windows also reveal a population-level shift in style prevalence.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/style-popularity.png"
  href="/assets/img/publications/football-playing-styles-dec/style-popularity.png"
  alt="Playing-style prevalence across 15-minute match windows"
  caption="Proactive styles are relatively more common early in matches, while Reactive Direct becomes more prevalent toward the closing stages."
  credit="Figure 9 from the journal article"
%}

Teams tend to begin matches with more proactive, structured possession identities. Reactive Direct football becomes progressively more common later in the match, particularly in the final 15 minutes and added time.

The paper interprets this as a gradual temporal redistribution rather than a sudden universal tactical phase change.

## Do attacking identities survive transitions?

The next extension joins phases that share a tactical feature space.

For attacking behavior:

- **IP ↔ PT** compares sustained possession with the moment immediately after gaining the ball.

For defensive behavior:

- **OP ↔ NT** compares settled defense with the moment immediately after losing possession.

For this higher-level analysis, each phase is reduced to $k=2$ so that styles form interpretable broad orientations.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/attack-coherence.png"
  href="/assets/img/publications/football-playing-styles-dec/attack-coherence.png"
  alt="Transitions between In-Possession and Positive Transition styles"
  caption="Attacking cross-phase coherence: most teams preserve their dominant attacking orientation from sustained possession into positive transition."
  credit="Figure 10 from the journal article"
  wide=true
%}

Attacking identity is highly coherent: possession-oriented teams tend to remain possession-oriented after recovering the ball, while direct teams tend to preserve direct progression.

Defense is more asymmetric.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/defense-coherence.png"
  href="/assets/img/publications/football-playing-styles-dec/defense-coherence.png"
  alt="Transitions between Out-of-Possession and Negative Transition styles"
  caption="Defensive cross-phase transitions are asymmetric: pressing teams often fall into more conservative structures immediately after losing possession."
  credit="Figure 11 from the journal article"
  wide=true
%}

Low-block teams rarely become aggressive pressers immediately after losing possession, while pressing teams more often fall back into conservative structures during negative transition.

That asymmetry suggests that **losing the ball is treated as a high-risk state** in which compactness can override the team's settled defensive identity.

## From four phases to one holistic identity

With two broad styles per phase and four phases, the framework produces

$$
2^4=16
$$

possible holistic tactical archetypes.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/holistic-archetypes.png"
  href="/assets/img/publications/football-playing-styles-dec/holistic-archetypes.png"
  alt="Distribution and win percentages of holistic phase-combination tactical archetypes"
  caption="Sixteen cross-phase archetypes combine attacking and defensive behavior across IP, PT, OP, and NT. The left panel shows prevalence; the right panel shows win percentage."
  credit="Figure 12 from the journal article"
  wide=true
%}

Two identities are especially prevalent: **Proactive Dominant** and **Reactive Direct**.

The outcome panel shows that prevalence and effectiveness are not identical. Possession-oriented attacking archetypes combined with selective or sustained pressing achieve some of the strongest win rates, while several internally inconsistent hybrid profiles perform substantially worse.

## How certain are those archetype win rates?

Because the archetypes contain different numbers of observations, the paper adds a bootstrap analysis with **1,000 resamples**.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/bootstrap-ci.png"
  href="/assets/img/publications/football-playing-styles-dec/bootstrap-ci.png"
  alt="Bootstrap confidence intervals for holistic tactical archetype win percentages"
  caption="Archetype win percentages with 95% non-parametric bootstrap confidence intervals."
  credit="Figure 13 from the journal article"
%}

Possession-oriented archetypes combine relatively high mean win rates with comparatively tight intervals. Rarer hybrid archetypes tend to have wider uncertainty.

The uncertainty analysis therefore prevents isolated high-performing small groups from being over-interpreted.

## Do the learned styles survive temporal distribution shift?

Finally, the paper trains the DEC models only on **first-half matches**, freezes both encoder and centroids, and evaluates directly on second-half data.

No retraining is permitted.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/frozen-ip-op.png"
  href="/assets/img/publications/football-playing-styles-dec/frozen-ip-op.png"
  alt="Frozen-model first-half to second-half evaluation for In-Possession and Out-of-Possession"
  caption="Frozen-model evaluation for In-Possession and Out-of-Possession. Dashed lines denote first-half performance; solid lines denote second-half transfer."
  credit="Figure 14 from the journal article"
  wide=true
%}

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-dec/frozen-transitions.png"
  href="/assets/img/publications/football-playing-styles-dec/frozen-transitions.png"
  alt="Frozen-model first-half to second-half evaluation for Positive and Negative Transition"
  caption="The same temporal transfer test for Positive and Negative Transition."
  credit="Figure 15 from the journal article"
  wide=true
%}

DEC experiences a visible drop under the second-half distribution shift, which is unsurprising given its much higher in-sample performance ceiling.

The key result is what remains after that drop:

- DEC still clearly leads in **Silhouette** and **A(C)2**;
- it remains competitive with or slightly better than classical baselines in **A(C)1**.

The latent playing-style representation is therefore not purely a first-half artifact.

## Takeaway

The extended paper changes the interpretation of playing-style clustering.

A cluster is no longer only a static label such as *Highly Proactive* or *Reactive Direct*. It becomes something that can be:

- **explained** through feature ablation, surrogate models, and SHAP;
- **tracked over time** inside a match;
- **related to outcome risk** when teams switch styles;
- **compared across possession phases**;
- **assembled into a holistic tactical archetype**;
- and **stress-tested under temporal distribution shift**.

The broader message is that a team's style is neither a single season-average vector nor a completely fluid state. It has a persistent structure, but that structure interacts with possession phase, match time, and tactical context.

The journal extension therefore moves from asking **“What style does this team play?”** to a more useful question:

> **How stable, explainable, coherent, and effective is that style across the situations that make up a football match?**
