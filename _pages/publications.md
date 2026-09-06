---
layout: page
permalink: /publications/
title: Publications
description: Papers and research outputs from NomadLab.
nav: true
nav_order: 3
---


{% if site.data.publications.order and site.data.publications.order.size > 0 %}
{% include publication-list.liquid publication_ids=site.data.publications.order %}
{% else %}
<div class="publication-shell nomad-panel"><div class="publication-empty"><div><i class="ti ti-books"></i><strong>No publication has been added yet.</strong></div></div></div>
{% endif %}
