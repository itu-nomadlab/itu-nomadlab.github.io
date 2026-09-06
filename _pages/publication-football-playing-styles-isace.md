---
layout: publication
title: "How Do Football Teams Play? A Deep Embedded Clustering Approach to Reveal Playing Styles"
permalink: /publications/football-playing-styles-isace/
publication_id: football-playing-styles-isace
description: "Deep Embedded Clustering over phase-specific football event representations to reveal interpretable team playing styles."
---

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/pipeline.png"
  href="/assets/img/publications/football-playing-styles-isace/pipeline.png"
  alt="Pipeline for phase-specific feature engineering and Deep Embedded Clustering of football playing styles"
  caption="The full pipeline: raw event data are split into four phases of play, converted into tactical features, embedded with an autoencoder, clustered with DEC, and aggregated to team-level styles by majority voting."
  credit="Figure 1 from the manuscript"
  wide=true
%}

<p class="publication-summary__lede">
A football team does not have one behavior. It attacks, defends, reacts after winning the ball, and reorganizes after losing it. This work models those behaviors separately and asks whether a deep unsupervised model can discover <strong>interpretable playing styles</strong> directly from large-scale event data. The answer is a four-phase Deep Embedded Clustering pipeline that learns tactical representations before assigning teams to dominant stylistic groups.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Events</span><strong>3M+</strong></div>
  <div class="publication-summary__fact"><span>Matches</span><strong>1,826</strong></div>
  <div class="publication-summary__fact"><span>Leagues</span><strong>Top five Europe</strong></div>
  <div class="publication-summary__fact"><span>Game phases</span><strong>4</strong></div>
  <div class="publication-summary__fact"><span>Latent size</span><strong>10</strong></div>
  <div class="publication-summary__fact"><span>Styles / phase</span><strong>k = 4</strong></div>
</div>

## Football style is phase dependent

The dataset contains event-level records from the 2016–17 seasons of the top-tier leagues in England, Spain, Italy, Germany, and France. Rather than compressing an entire match into one vector, every event is assigned to one of four tactical phases:

- **In-Possession (IP):** attacking behavior while holding the ball;
- **Out-of-Possession (OP):** defensive behavior while the opponent controls the ball;
- **Positive Transition (PT):** the immediate period after gaining possession;
- **Negative Transition (NT):** the immediate period after losing possession.

Each team in each match is treated as an individual sample. This yields **3,652 team-match samples per game phase**, allowing a club to express different behaviors across different match contexts before its dominant season-level style is determined.

## Turning event streams into tactical features

The feature engineering combines spatial, sequential, and network views of football.

### Spatial zoning

The pitch is split into three zones so that actions preserve rough field position without causing an explosion in feature dimensionality.

### Pass direction and distance

Passes are grouped by:

- forward / sideways / backward direction;
- short / medium / long distance;
- selected subtypes such as high and smart passes.

These statistics are normalized as frequency ratios, including zone-specific variants.

### Pass motifs

Short passing sequences are represented as motifs such as `ABAB` and `ABCD`. Repeated motifs provide a compact description of build-up structure and ball circulation.

### Passing networks

Passes define directed player graphs. Graph-connectivity statistics summarize whether the team distributes possession broadly or relies on a small set of central players.

### Defensive and transition behavior

Duels, runs, fouls, shots, and transitions contribute phase-specific statistics. The final representation contains **30 features for attacking phases** and **45 for defensive phases**.

## Why deep clustering?

Traditional methods such as K-Means, K-Medoids, and Ward clustering operate directly on the feature space—or after a separate dimensionality-reduction step. DEC instead learns the representation and clustering objective together.

The pipeline begins with autoencoder pretraining:

$$
\mathcal{L}_{AE}
=
\frac{1}{N}
\sum_{i=1}^{N}
\lVert x_i-\hat{x}_i\rVert_2^2.
$$

The encoder compresses tactical features through:

$$
D \rightarrow 128 \rightarrow 64 \rightarrow 10,
$$

while the decoder mirrors this structure.

The autoencoder is trained for **3,000 epochs** with Adam at a learning rate of $10^{-3}$.

## From latent vectors to soft cluster assignments

K-Means on the learned latent vectors initializes the DEC cluster centroids.

DEC then assigns latent point $z_i$ to centroid $\mu_j$ using a Student-$t$ kernel:

$$
q_{ij}
=
\frac{
\left(1+\lVert z_i-\mu_j\rVert^2/\alpha\right)^{-\frac{\alpha+1}{2}}
}{
\sum_{j'}
\left(1+\lVert z_i-\mu_{j'}\rVert^2/\alpha\right)^{-\frac{\alpha+1}{2}}
}.
$$

Confident assignments are sharpened into the target distribution

$$
p_{ij}
=
\frac{
q_{ij}^{2}/\sum_i q_{ij}
}{
\sum_{j'}
\left(q_{ij'}^{2}/\sum_i q_{ij'}\right)
}.
$$

The encoder is then refined by minimizing

$$
\mathcal{L}_{KL}
=
\mathrm{KL}(P\parallel Q)
=
\sum_i\sum_j
p_{ij}
\log\frac{p_{ij}}{q_{ij}}.
$$

This clustering stage is trained for another **3,000 epochs**.

Importantly, the whole procedure is repeated **independently for each of the four game phases**.

## How clustering quality is measured

The paper evaluates cluster quality with three complementary measures.

The standard Silhouette value for sample $i$ is

$$
s(i)
=
\frac{b(i)-a(i)}
{\max\{a(i),b(i)\}},
$$

where $a(i)$ is the average distance to its own cluster and $b(i)$ is the average distance to the closest alternative cluster.

To remain comparable with the football-playing-style benchmark of Moffatt et al., the paper also uses two composite indices:

$$
A(C)_1
=
\frac{
I_{wcss}+I_{sep}+I_{distcc}+I_{dens}
}{4},
$$

and

$$
A(C)_2
=
\frac{
I_{wcss}+0.5I_{sep}+I_{distcc}+0.25I_{dens}
}{2.75}.
$$

## DEC versus classical clustering

Across the four phases, DEC is compared with K-Means, K-Medoids, and Ward clustering, with classical methods also evaluated after two-dimensional PCA.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/evaluation-ip-op.png"
  href="/assets/img/publications/football-playing-styles-isace/evaluation-ip-op.png"
  alt="Clustering evaluation across k for in-possession and out-of-possession phases"
  caption="Clustering quality across values of k for In-Possession and Out-of-Possession. DEC remains above the classical baselines across the evaluated metrics."
  credit="Figure 2 from the manuscript"
  wide=true
%}

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/evaluation-transitions.png"
  href="/assets/img/publications/football-playing-styles-isace/evaluation-transitions.png"
  alt="Clustering evaluation across k for positive and negative transition phases"
  caption="The same comparison for Positive and Negative Transition phases."
  credit="Figure 3 from the manuscript"
  wide=true
%}

The classical methods improve noticeably after PCA, illustrating how high-dimensional tactical features weaken distance-based clustering. DEC is less exposed to this problem because its latent representation is trained specifically for clustering.

For the In-Possession analysis, the three evaluation measures select **$k=4$**.

## Does the representation actually converge?

The manuscript reports both reconstruction and clustering losses during training:

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/training-loss.png"
  href="/assets/img/publications/football-playing-styles-isace/training-loss.png"
  alt="Autoencoder reconstruction and DEC KL divergence losses"
  caption="Autoencoder pretraining loss and DEC KL-divergence loss during the first 100 epochs of the In-Possession experiment."
  credit="Figure 4 from the manuscript"
%}

Both losses decrease rapidly and flatten near zero.

The learned latent space is also visibly separable:

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/latent-space.png"
  href="/assets/img/publications/football-playing-styles-isace/latent-space.png"
  alt="PCA visualization of DEC latent clusters"
  caption="Two-dimensional PCA projection of the DEC latent representation for the In-Possession phase."
  credit="Figure 5 from the manuscript"
%}

The representation is not simply lower dimensional: the cluster-refinement objective reorganizes the latent geometry into four clearly separated groups.

## Four interpretable styles

The paper focuses its tactical interpretation on the **In-Possession** phase.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr>
<th>Style</th>
<th>Passes / game</th>
<th>High-pass ratio</th>
<th>Shots / game</th>
<th>Network connectivity</th>
<th>ABCB motif</th>
</tr>
</thead>
<tbody>
<tr><td><strong>Highly Proactive (C1)</strong></td><td>576.9</td><td>0.10</td><td>14.3</td><td>8.1</td><td>0.098</td></tr>
<tr><td><strong>Reactive Direct (C2)</strong></td><td>302.7</td><td>0.21</td><td>9.1</td><td>6.7</td><td>0.087</td></tr>
<tr><td><strong>Moderately Reactive (C0)</strong></td><td>375.8</td><td>0.18</td><td>10.1</td><td>7.3</td><td>0.093</td></tr>
<tr><td><strong>Balanced Proactive (C3)</strong></td><td>453.9</td><td>0.14</td><td>10.8</td><td>7.7</td><td>0.096</td></tr>
</tbody>
</table>
</div>

### Highly Proactive

The most possession-dominant group: highest pass volume, highest shot volume, strongest passing-network connectivity, low reliance on high balls, and frequent structured pass motifs.

### Reactive Direct

The stylistic opposite: few passes, fewer shots, the highest high-pass ratio, weaker connectivity, and lower motif frequency. The profile is consistent with vertical play and counter-attacking.

### Moderately Reactive

A less extreme profile combining moderate ball circulation with relatively direct passing.

### Balanced Proactive

Possession-oriented and well connected, but less intense than the Highly Proactive cluster and more willing to use longer passes.

The four styles therefore form a spectrum from controlled possession to direct transition football rather than four arbitrary numerical clusters.

## Do some styles actually win more?

The paper links style assignments back to real match outcomes.

{% include publication-figure.liquid
  src="/assets/img/publications/football-playing-styles-isace/win-heatmap.png"
  href="/assets/img/publications/football-playing-styles-isace/win-heatmap.png"
  alt="Win percentage heatmap between playing-style clusters"
  caption="Win percentages for each tactical style against every opponent style."
  credit="Figure 6 from the manuscript"
%}

The most striking result is that **Highly Proactive** teams are strongest across nearly every matchup, with win rates ranging from **44% to 57%**.

Reactive Direct teams also outperform the two more moderate styles in many matchups.

That produces an interesting tactical conclusion: the strongest groups are not necessarily the most balanced. The two more stylistically extreme identities—possession dominance and direct counter-attacking—perform better than the moderate/hybrid groups.

## Tactical identities across Europe

Season-level team labels are obtained by majority voting over each team's match-level assignments.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr><th>League</th><th>C0</th><th>C1</th><th>C2</th><th>C3</th><th>Example identities</th></tr>
</thead>
<tbody>
<tr><td>Bundesliga</td><td>4</td><td>4</td><td>2</td><td>8</td><td>Augsburg · Bayern Munich · Union Berlin · Leipzig</td></tr>
<tr><td>La Liga</td><td>4</td><td>4</td><td>6</td><td>6</td><td>Osasuna · Barcelona · Celta Vigo · Atletico Madrid</td></tr>
<tr><td>Ligue 1</td><td>0</td><td>6</td><td>4</td><td>9</td><td>— · PSG · Metz · Marseille</td></tr>
<tr><td>Premier League</td><td>5</td><td>6</td><td>8</td><td>1</td><td>Everton · Manchester City · Sheffield Utd · Arsenal</td></tr>
<tr><td>Serie A</td><td>1</td><td>9</td><td>7</td><td>3</td><td>Salernitana · Napoli · Verona · Lazio</td></tr>
</tbody>
</table>
</div>

Several league-level patterns emerge:

- **La Liga** is comparatively diverse across the four styles.
- **Serie A** contains nine Highly Proactive teams and seven Reactive Direct teams.
- The **Premier League** is strongly polarized toward Reactive Direct and Highly Proactive, with only one Balanced Proactive team.
- **Ligue 1** has no Moderately Reactive teams in the season-level majority assignment.
- The **Bundesliga** is skewed toward Balanced Proactive styles.

The clusters therefore act not only as team descriptors but also as summaries of the tactical ecosystems of different leagues.

## Why majority voting?

A team can land in different clusters from match to match because opponent, scoreline, venue, and game state alter behavior.

The framework therefore does not assume a club has a fixed style in every game. Instead, it computes a **dominant seasonal identity** by majority vote after clustering all team-match instances.

That distinction keeps the underlying data match-specific while still producing a team-level label useful for scouting and comparison.

## Takeaway

The paper uses deep clustering to move beyond simple possession percentages and aggregate box-score statistics.

Its central idea is:

> **learn the tactical representation first, then discover the style.**

By separating football into four phases, representing each phase through spatial, passing, motif, network, and event features, and refining those representations with DEC, the framework produces clusters that are statistically stronger than classical baselines and tactically interpretable.

The result is not merely a taxonomy of football teams. The discovered styles can be connected to **matchup success, league identity, opponent scouting, and strategic preparation**—capturing not just who a team is, but how it tends to play.
