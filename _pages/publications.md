---
layout: page
permalink: /publications/
title: Publications
description: Papers, preprints, technical reports, and open research artifacts from NomadLab.
nav: true
nav_order: 4
---

<div class="page-intro nomad-panel publication-intro">
  <p class="micro-label">Research record</p>
  <p class="page-intro__lead">Papers, preprints, technical reports, and open research artifacts will be collected here.</p>
  <p>Entries are grouped by year and become searchable as soon as the verified lab bibliography is added.</p>
</div>

{% if site.nomadlab.publications_ready %}
  {% include bib_search.liquid %}
  <div class="publications publication-shell nomad-panel">
    {% bibliography %}
  </div>
{% else %}
  <div class="publication-shell nomad-panel">
    <div class="publication-empty">
      <div><i class="ti ti-books"></i><strong>The complete publication list is being migrated.</strong><br>Verified records will appear here automatically.</div>
    </div>
  </div>
{% endif %}
