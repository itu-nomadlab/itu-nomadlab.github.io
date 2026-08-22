---
layout: page
title: Collaborations
permalink: /collaborations/
description: Applied research programs developed with public agencies, university centers, and domain partners.
nav: true
nav_order: 6
---

<div class="page-intro nomad-panel">
  <p class="micro-label">Collaborative projects</p>
  <p class="page-intro__lead">NomadLab contributes visual intelligence and machine-learning expertise to multidisciplinary programs with scientific and operational impact.</p>
  <p>The two featured collaborations connect image processing with materials science and space-mission support systems.</p>
</div>

<div class="collaboration-grid">
{% for project_id in site.data.collaborations.order %}
{% include collaboration-card.liquid id=project_id %}
{% endfor %}
</div>
