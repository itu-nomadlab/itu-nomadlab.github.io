---
layout: publication
title: "LLMigrate: Large Language Models as Migration Controllers in Island-Based Evolutionary Design of Soft Robots"
permalink: /publications/llmigrate/
publication_id: llmigrate
description: "LLM-guided migration for island-model evolutionary design of voxel-based soft robots."
paper_url: https://doi.org/10.1145/3795101.3805447
code_url: https://github.com/emirb0/evogym-migration
---

<p class="publication-summary__lede">
LLMigrate treats migration in an island-model evolutionary algorithm as a decision problem. Instead of moving individuals with a fixed heuristic, a large language model receives compact summaries of the current islands and decides which morphologies should move where. The goal is not simply to maximize fitness, but to preserve useful structural diversity under the unusually small evaluation budgets imposed by soft-robot co-design.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Morphology</span><strong>5 × 5 voxel robots</strong></div>
  <div class="publication-summary__fact"><span>Population</span><strong>30 individuals</strong></div>
  <div class="publication-summary__fact"><span>Islands</span><strong>4 subpopulations</strong></div>
  <div class="publication-summary__fact"><span>Evolution</span><strong>7 generations</strong></div>
  <div class="publication-summary__fact"><span>Controller training</span><strong>512k env. steps / robot</strong></div>
  <div class="publication-summary__fact"><span>Migration budget</span><strong>up to 20%</strong></div>
</div>

## Why migration is the interesting part

Soft-robot design couples two expensive searches: a morphology must first be proposed, and then a controller must be trained well enough to reveal whether that body is actually useful. This makes fitness evaluation noisy and costly. Island models help by splitting the population into partially isolated subpopulations, but the migration policy is usually fixed in advance.

LLMigrate changes that part of the loop. The language model does not directly replace evolution. It acts as a **process-level migration controller**: after local evolution, it examines island summaries and decides how information should flow between islands before the next generation begins.

The publication-list cover image is Figure 1 from the manuscript and shows the complete loop: island populations → LLM mutation → PPO evaluation → truncation selection → island summaries → LLM migration manager → updated islands.

## Evolutionary pipeline

Each candidate is a connected $5\times5$ voxel morphology. A cell is encoded with one of five values representing empty, rigid, soft, horizontal-actuator, or vertical-actuator material. Every valid morphology must contain at least one actuator.

The experiments use three EvoGym tasks:

- **Walker-v0** — forward locomotion,
- **Pusher-v0** — locomotion while pushing a box,
- **Carrier-v0** — locomotion while carrying a box without dropping it.

Each morphology is evaluated by training a PPO controller from scratch for **1,000 PPO updates**, corresponding to **512,000 environment steps**. With 30 individuals evolved for 7 generations, a single evolutionary trial requires **210 independent PPO training runs**, or more than **107 million environment steps**.

The four islands are initialized with $K$-means clustering over voxel features to encourage different starting profiles. Within each island, truncation selection keeps the stronger individuals. Offspring are generated mainly through an LLM-based mutation operator; a 10% random-mutation probability and a random fallback are retained for robustness. No explicit crossover is used.

After a synchronized generation, the migration controller receives fitness-sorted summaries of all islands together with compact morphology strings. It returns a machine-readable migration plan specifying which individuals should move to which islands. At most 20% of the total population can migrate in a round.

## What is being compared

The evaluation separates mutation, migration, and island structure through five configurations:

1. random mutation + LLM-guided migration,
2. LLM mutation + random migration,
3. **LLM mutation + LLM-guided migration (LLMigrate)**,
4. LLM mutation without islands (panmictic evolution),
5. a MAP-Elites-style quality-diversity baseline.

The QD baseline uses a two-dimensional descriptor space based on total voxel count and actuator voxel count. This creates a useful contrast: MAP-Elites explicitly tries to cover a descriptor space, whereas LLMigrate tries to retain diversity through island isolation and selective exchange.

## Measuring structural diversity

The manuscript measures morphology diversity using the average pairwise Levenshtein distance between flattened $5\times5$ voxel grids. Written explicitly, the definition can be expressed as

$$
D(P)=\frac{2}{n(n-1)}\sum_{1\leq i<j\leq n} d_{\mathrm{Lev}}(x_i,x_j),
$$

where $x_i$ and $x_j$ are flattened voxel encodings and $d_{\mathrm{Lev}}$ is Levenshtein edit distance. Higher values therefore indicate a population containing more structurally distinct robot bodies.

## Fitness results

<div class="publication-table-scroll">
<table class="publication-results-table">
  <thead><tr><th>Task</th><th>Method</th><th>Average</th><th>Best</th></tr></thead>
  <tbody>
    <tr><td rowspan="5"><strong>Walker-v0</strong></td><td>Random mutation + LLM migration</td><td>10.582</td><td>10.610</td></tr>
    <tr><td>LLM mutation + random migration</td><td>10.589</td><td>10.595</td></tr>
    <tr><td><strong>LLM mutation + LLM migration</strong></td><td><strong>10.595</strong></td><td><strong>10.617</strong></td></tr>
    <tr><td>LLM mutation, no islands</td><td><strong>10.595</strong></td><td>10.612</td></tr>
    <tr><td>QD</td><td>10.591</td><td>10.602</td></tr>
    <tr><td rowspan="5"><strong>Pusher-v0</strong></td><td>Random mutation + LLM migration</td><td>8.423</td><td>8.849</td></tr>
    <tr><td>LLM mutation + random migration</td><td>8.902</td><td>9.822</td></tr>
    <tr><td><strong>LLM mutation + LLM migration</strong></td><td><strong>9.687</strong></td><td><strong>10.003</strong></td></tr>
    <tr><td>LLM mutation, no islands</td><td>9.550</td><td>9.723</td></tr>
    <tr><td>QD</td><td>9.299</td><td>9.777</td></tr>
    <tr><td rowspan="5"><strong>Carrier-v0</strong></td><td>Random mutation + LLM migration</td><td>8.126</td><td>8.876</td></tr>
    <tr><td>LLM mutation + random migration</td><td>7.287</td><td>8.578</td></tr>
    <tr><td><strong>LLM mutation + LLM migration</strong></td><td>9.509</td><td>10.578</td></tr>
    <tr><td>LLM mutation, no islands</td><td><strong>9.930</strong></td><td><strong>10.619</strong></td></tr>
    <tr><td>QD</td><td>8.262</td><td>9.189</td></tr>
  </tbody>
</table>
</div>

The task dependence is important. **Pusher-v0** is where LLM-guided migration gives the strongest fitness result among the tested configurations. **Carrier-v0** favors the more focused no-island LLM-mutator baseline, although LLMigrate remains competitive. **Walker-v0** is comparatively saturated: several distinct configurations reach almost the same fitness.

## What the evolved robots actually do

The fitness values are easier to interpret alongside the rollout trajectories. The figure below is the **penultimate figure in the manuscript** and shows pose trails of representative final-generation solutions for Walker-v0 and Carrier-v0.

{% include publication-figure.liquid
  src="/assets/img/publications/llmigrate/trails.png"
  href="/assets/img/publications/llmigrate/trails.png"
  alt="Pose trails of final-generation soft robots for Walker-v0 and Carrier-v0"
  caption="Pose trails for (a) Walker-v0 and (b) Carrier-v0 using the final-generation best morphology from each method (rows)."
  credit="From the manuscript"
%}

The trajectories make the morphology-controller coupling visible. Different bodies can achieve similar returns in locomotion, while the carrying task imposes a stronger structural constraint because the robot must move without losing the payload.

## Diversity is where island structure matters

The final figure in the manuscript tracks average structural diversity through all seven generations. QD maintains the highest final diversity, but the island-based migration methods preserve substantially more structural variation than panmictic evolution without migration.

{% include publication-figure.liquid
  src="/assets/img/publications/llmigrate/diversity.png"
  href="/assets/img/publications/llmigrate/diversity.png"
  alt="Average pairwise Levenshtein diversity across generations for Carrier, Pusher, and Walker"
  caption="Average structural diversity across generations for Carrier-v0, Pusher-v0, and Walker-v0."
  credit="From the manuscript"
%}

The no-island baseline loses diversity rapidly, most dramatically in Walker-v0 and Carrier-v0. Migration slows that collapse. This is the central trade-off highlighted by the paper: LLM-guided migration does not always maximize raw fitness, but it offers a way to retain structurally different candidates while staying competitive under a constrained evaluation budget.

## Takeaway

The main result is not that an LLM should replace an evolutionary algorithm. It is that an LLM can act **one level above the population**, coordinating information flow between evolutionary subpopulations. In this setting, migration becomes state-conditioned rather than fixed: strong designs can propagate, while structurally unusual candidates can be preserved as possible stepping stones instead of disappearing immediately under local selection pressure.

The approach is still task dependent, and large-scale LLM querying adds computational cost. The manuscript therefore frames LLMigrate as a proof of concept for using language models as adaptive coordinators inside distributed evolutionary search, with smaller or distilled migration controllers left as a natural next step.
