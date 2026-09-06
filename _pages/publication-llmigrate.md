---
layout: publication
title: "LLMigrate: Large Language Models as Migration Controllers in Island-Based Evolutionary Design of Soft Robots"
permalink: /publications/llmigrate/
publication_id: llmigrate
description: A NomadLab publication presented at GECCO 2026.
---

<p class="publication-summary__lede">
LLMigrate investigates a simple question at the intersection of evolutionary computation and language models: in an island-based evolutionary search, can an LLM act as a higher-level controller that decides how information should move between evolving populations?
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Setting</span>Island-based evolutionary design</div>
  <div class="publication-summary__fact"><span>Domain</span>Soft-robot design</div>
  <div class="publication-summary__fact"><span>Controller</span>Large language model</div>
</div>

## Why migration matters

Island-model evolutionary algorithms maintain several populations in parallel. Each island can explore a different region of the search space, while occasional migration lets useful individuals or design information move between islands. The migration policy therefore affects the balance between **local specialization** and **global information exchange**.

LLMigrate studies the LLM at this coordination layer. Instead of treating migration as only a fixed, hand-written mechanism, the language model is positioned as a controller that can reason over the state of the distributed search and influence migration between islands.

{% include publication-figure.liquid
  src="/assets/img/publications/llmigrate/overview.svg"
  alt="Conceptual overview of an LLM coordinating migration between evolutionary islands"
  caption="Conceptual overview of the LLMigrate research idea. Replace this site illustration with a paper figure when the final artifact is available."
  credit="NomadLab site illustration"
%}

## A compact mathematical view

A useful way to describe the controller at a high level is to separate the **search state** from the **migration action**. Let the state observed at migration step $t$ be $s_t$, containing information about the current islands and their candidate designs. The controller can then be written conceptually as

$$
a_t = \pi_{\mathrm{LLM}}(s_t),
$$

where $a_t$ denotes the migration decision produced by the LLM. The evolutionary process applies that decision, updates the island populations, and produces the next state $s_{t+1}$.

<div class="publication-equation-note">
This notation is an explanatory view for the website rather than a claim that the paper uses this exact equation. For final paper pages, equations from the manuscript can be pasted here directly in LaTeX/MathJax form.
</div>

## What the paper contributes

The key idea is to move the LLM **outside the individual soft-robot representation** and use it as a coordination mechanism for a distributed evolutionary process. This creates a separation between two levels of search:

1. the evolutionary islands continue to generate and evaluate candidate soft-robot designs;
2. the LLM operates at the migration level, deciding how information should be exchanged between those islands.

This framing is useful because it treats language models not only as generators, but as components that can participate in the control logic of an optimization system.

## Publication context

The work was accepted in the Genetic Algorithms track of **GECCO 2026** and appears in the GECCO Companion proceedings on pages 361–364. The final version of this page can later be expanded with the paper's experimental protocol, quantitative results, ablations, final figures, and implementation details.

<!--
For future paper pages, useful building blocks are:

### Figure
{% include publication-figure.liquid
  src="/assets/img/publications/PAPER-ID/figure-1.png"
  alt="Describe the figure for accessibility"
  caption="Figure 1. Your caption."
  credit="From the paper"
%}

### Equation
$$
\mathcal{L}(\theta) = \mathcal{L}_{task}(\theta) + \lambda\,\mathcal{L}_{aux}(\theta)
$$

### Recommended section order
- Research question
- Motivation / problem
- Method
- Figure / architecture
- Mathematical formulation
- Experiments
- Main results
- Limitations
- Resources
-->
