# NomadLab içerik rehberi

Bu dosya, sık yapılan değişikliklerin kısa referansıdır.

## Yeni kişi ekleme

`_data/people.yml` içindeki uygun grubun `members:` listesine yeni kayıt ekleyin. Yeni bir grup için:

```yaml
  - id: msc
    title: MSc Researchers
    description: Master's researchers at NomadLab.
    members:
      - name: Student Name
        role: MSc Student
        initials: SN
        bio: One-sentence research description.
        interests:
          - Research topic one
          - Research topic two
```

`image` alanı verilmezse kartta baş harfler gösterilir.

## Yeni araştırma alanı ekleme

`_data/research.yml`:

```yaml
  - code: ROUTE-05
    icon: topology-star-3
    title: New Research Route
    summary: A concise description.
    questions:
      - First research question?
      - Second research question?
    keywords:
      - keyword one
      - keyword two
```

İkon adı Tabler Icons webfont sınıfındaki `ti-` sonrasıdır.

## Yeni proje/direction ekleme

`_data/projects.yml`:

```yaml
  - code: NMD-04
    title: Project title
    type: Research direction
    status: active
    summary: Project description.
    tags:
      - topic one
      - topic two
    url: /projects/project-slug/
```

`url` boş bırakılırsa kart bağlantısız gösterilir.

## Renk paleti ekleme

İki dosyada aynı palet anahtarını ekleyin:

1. `assets/js/nomad-mode.js` içindeki `PALETTES`
2. `_sass/_nomadlab.scss` içindeki `html[data-nomad-palette="..."]`

Örnek:

```scss
html[data-nomad-palette="ocean"] {
  --nomad-bg: #0b1f33;
  --nomad-ink: #9ee7ff;
  --nomad-paper: #0b1f33;
  --nomad-glow: #9ee7ff;
}
```

## Nomad Mode'u başlangıçta açık yapmak

`_config.yml`:

```yaml
nomad_mode_default: true
```

Kullanıcının daha önce kaydedilmiş tercihi varsa kayıtlı tercih önceliklidir.

## Animasyon yoğunluğunu değiştirme

`assets/js/turing-background.js` içindeki:

- `targetSize()` render çözünürlüğünü,
- fragment shader içindeki `u_time` çarpanı hızı,
- `smoothstep` eşikleri desen yoğunluğunu belirler.

Mobil cihazlardaki performans için `targetSize()` içindeki `step` değerlerini gereksiz yere küçültmeyin.
