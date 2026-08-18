---
layout: page
permalink: /publications/
title: Publications
description: Papers and research outputs from NomadLab.
nav: true
nav_order: 4
---

<div class="page-intro nomad-panel publication-intro">
  <p class="micro-label">Research record</p>
  <p class="page-intro__lead">Papers and research outputs from NomadLab, with a dedicated page for every publication.</p>
  <p>Author names marked <span class="author-type-key author-type-key--undergraduate">UG</span> open an undergraduate profile with a graduation poster. Names marked <span class="author-type-key author-type-key--graduate">GR</span> open a graduate profile with thesis information. Unmarked co-authors are listed without a profile link.</p>
</div>

{% if site.data.publications.order and site.data.publications.order.size > 0 %}
  {% include publication-list.liquid publication_ids=site.data.publications.order %}
{% else %}
  <div class="publication-shell nomad-panel"><div class="publication-empty"><div><i class="ti ti-books"></i><strong>No publication has been added yet.</strong></div></div></div>
{% endif %}
