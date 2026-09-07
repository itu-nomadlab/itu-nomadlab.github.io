---
layout: publication
title: "CAE-FNO: A Fourier Neural Operator-Based Acoustic Anomaly Detection Network"
permalink: /publications/cae-fno/
publication_id: cae-fno
description: "A raw-waveform reconstruction autoencoder that combines global Fourier operators with local temporal convolutions for unsupervised industrial acoustic anomaly detection."
paper_url:
code_url: https://github.com/ugur-bol/CAE-FNO
---

{% include publication-figure.liquid
  src="/assets/img/publications/cae-fno/architecture.png"
  href="/assets/img/publications/cae-fno/architecture.png"
  alt="Architecture of CAE-FNO"
  caption="CAE-FNO operates directly on 200,000-sample raw waveforms using skip-connected encoder/decoder stages built from Convolutional Fourier Layers."
  credit="Architecture figure from the MMSP 2026 manuscript"
  wide=true
%}

<p class="publication-summary__lede">
Industrial machines often produce strongly regular acoustic rhythms during normal operation. Faults disturb that regularity—not only as local waveform events, but also as changes in the signal's global spectral structure. <strong>CAE-FNO</strong> models both scales at once: each block combines a Fourier-domain operator that sees the entire waveform with a local temporal convolution, and the network learns normal machine sound purely through reconstruction.
</p>

<div class="publication-summary__facts">
  <div class="publication-summary__fact"><span>Task</span><strong>Acoustic anomaly detection</strong></div>
  <div class="publication-summary__fact"><span>Input</span><strong>Raw waveform</strong></div>
  <div class="publication-summary__fact"><span>Duration</span><strong>10 s @ 20 kHz</strong></div>
  <div class="publication-summary__fact"><span>Training</span><strong>Normal only</strong></div>
  <div class="publication-summary__fact"><span>Overall AUC</span><strong>0.918</strong></div>
  <div class="publication-summary__fact"><span>Overall pAUC</span><strong>0.799</strong></div>
</div>

## Why Fourier operators for machine sound?

A conventional temporal convolution observes only a bounded local neighborhood unless many layers or very large kernels are used.

Industrial audio often has another kind of structure: periodicity and spectral regularity distributed across an entire recording. The characteristic rhythm of a planer, motor, or rotating component is a global property.

Fourier Neural Operators provide a direct mechanism for learning that structure in frequency space.

Given an input function \(v\), the spectral branch computes

$$
u(x)
=
\mathcal{F}^{-1}
\left(
R\cdot\mathcal{F}(v)
\right)(x),
$$

where \(R\) is a trainable complex-valued tensor acting on the retained Fourier modes.

Only the first \(k_{\max}\) modes are preserved. The operator therefore learns a trainable global spectral transformation with FFT-based quasi-linear complexity.

## Global frequency is not enough

The original FNO formulation pairs the Fourier branch with a pointwise \(1\times1\) local path.

For raw audio, CAE-FNO instead uses a standard one-dimensional convolution with kernel size 11. This allows the local branch to capture short-range waveform structure and approximate local temporal derivatives.

The resulting **Convolutional Fourier Layer (CFL)** is

$$
y
=
\hat{\mathcal F}^{-1}
\left(
R_{k_{\max}}
\cdot
\hat{\mathcal F}(x)
\right)
+
W\star x.
$$

The two terms play different roles:

- the Fourier branch models signal-wide spectral regularities;
- the Conv1d branch models local waveform structure.

{% include publication-figure.liquid
  src="/assets/img/publications/cae-fno/cfl.png"
  href="/assets/img/publications/cae-fno/cfl.png"
  alt="Convolutional Fourier Layer with parallel spectral and Conv1d branches"
  caption="A Convolutional Fourier Layer processes the waveform through a truncated spectral branch and a local Conv1d bypass, then sums both signals before normalization and activation."
  credit="CFL figure from the MMSP 2026 manuscript"
  wide=true
%}

Each CFL uses

$$
k_{\max}=16
$$

Fourier modes and a local convolution kernel of size

$$
k=11.
$$

## Reconstruction instead of fault classification

CAE-FNO does not require labeled examples of machine faults.

The model is trained exclusively on normal recordings and learns the mapping

$$
x
\longrightarrow
\hat{x}.
$$

At inference time, the anomaly score for a recording is simply the waveform reconstruction error:

$$
s(x)
=
\frac{1}{T}
\sum_{t=1}^{T}
(x_t-\hat{x}_t)^2.
$$

If a recording violates the learned acoustic rhythm, the reconstruction error rises.

This is especially useful in industrial monitoring because failures are naturally scarce and often poorly represented in supervised training data.

## Raw waveforms rather than spectrograms

The strongest related baseline operates on mel spectrograms.

CAE-FNO instead consumes the original waveform directly:

$$
T=200{,}000
$$

samples for every 10-second clip at 20 kHz.

This avoids imposing a hand-designed time-frequency discretization before the model sees the signal. The Fourier branches learn their own spectral representation directly from the waveform.

## Network structure

The encoder follows the channel progression

$$
1
\rightarrow
32
\rightarrow
64
\rightarrow
128
\rightarrow
256
\rightarrow
512.
$$

Four factor-5 pooling stages reduce the 200,000-sample input to a

$$
512\times320
$$

latent representation.

The decoder mirrors this process with nearest-neighbor upsampling and skip connections.

Every encoder and decoder block contains two CFLs.

A final \(1\times1\) convolution maps the 32-channel decoder output back to one reconstructed waveform.

## Industrial wood-planer benchmark

Evaluation uses a real industrial wood-planer dataset containing **7,562 ten-second recordings**, approximately 21 hours of audio.

The training split contains:

- **4,327** anomaly-free recordings;
- three board grades;
- recordings collected after knife-jointing or head-change operations.

The evaluation split contains **3,235** recordings:

- **3,130 normal**
- **105 anomalous**

The anomalies are divided into:

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Fault type</th><th>Clips</th></tr></thead>
<tbody>
<tr><td>Broken Board</td><td>4</td></tr>
<tr><td>Board Stuck</td><td>29</td></tr>
<tr><td>Uneven or Thick Wood</td><td>72</td></tr>
</tbody>
</table>
</div>

Because anomalies are rare—roughly a 1:30 imbalance—the paper uses both full AUC and partial AUC at

$$
\mathrm{FPR}\le 0.1.
$$

The low-FPR region is particularly important operationally because a factory anomaly detector cannot generate constant false alarms.

## Training

CAE-FNO is optimized with AdamW using an initial learning rate

$$
\eta_0=10^{-3}.
$$

The schedule uses cosine annealing with warm restarts and

$$
T_0=10
$$

epochs.

Training uses batch size 16. The manuscript reports a total training time of **327.8 minutes on an NVIDIA RTX A5000**.

No anomaly threshold is tuned for the reported AUC and pAUC results.

## Overall results

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead><tr><th>Model</th><th>AUC</th><th>pAUC</th></tr></thead>
<tbody>
<tr><td>Skip-CAE-Transformer</td><td>0.875</td><td>0.785</td></tr>
<tr><td>Skip-CAE</td><td>0.846</td><td>0.787</td></tr>
<tr><td>CAE of Duman et al.</td><td>0.798</td><td>0.720</td></tr>
<tr><td>OneClassSVM</td><td>0.683</td><td>0.516</td></tr>
<tr><td>DCASE Baseline</td><td>0.520</td><td>0.477</td></tr>
<tr><td>Isolation Forest</td><td>0.518</td><td>0.474</td></tr>
<tr><td><strong>CAE-FNO</strong></td><td><strong>0.918</strong></td><td><strong>0.799</strong></td></tr>
</tbody>
</table>
</div>

CAE-FNO improves the strongest previous AUC from **0.875 to 0.918**, a gain of **4.3 percentage points**.

Its pAUC also rises from the strongest previous value of **0.787 to 0.799**.

{% include publication-figure.liquid
  src="/assets/img/publications/cae-fno/roc.png"
  href="/assets/img/publications/cae-fno/roc.png"
  alt="ROC curves comparing CAE-FNO with acoustic anomaly detection baselines"
  caption="ROC comparison on the 3,235-clip evaluation set. CAE-FNO maintains the strongest curve, including the operationally important low-FPR regime."
  credit="ROC figure from the MMSP 2026 manuscript"
  wide=true
%}

## Performance depends on the type of fault

The per-anomaly breakdown reveals where Fourier modeling helps most.

<div class="publication-table-scroll">
<table class="publication-results-table">
<thead>
<tr>
<th>Model</th>
<th>Broken Board AUC</th>
<th>Broken Board pAUC</th>
<th>Board Stuck AUC</th>
<th>Board Stuck pAUC</th>
<th>Uneven/Thick AUC</th>
<th>Uneven/Thick pAUC</th>
</tr>
</thead>
<tbody>
<tr><td>Skip-CAE-Transformer</td><td>0.743</td><td><strong>0.677</strong></td><td>0.778</td><td>0.744</td><td>0.921</td><td>0.807</td></tr>
<tr><td>Skip-CAE</td><td><strong>0.777</strong></td><td>0.618</td><td>0.723</td><td>0.729</td><td>0.900</td><td>0.820</td></tr>
<tr><td><strong>CAE-FNO</strong></td><td>0.705</td><td>0.474</td><td><strong>0.872</strong></td><td><strong>0.768</strong></td><td><strong>0.949</strong></td><td><strong>0.829</strong></td></tr>
</tbody>
</table>
</div>

CAE-FNO is especially strong on:

- **Board Stuck:** AUC 0.872
- **Uneven or Thick Wood:** AUC 0.949, pAUC 0.829

It is weaker on Broken Board.

The manuscript treats this result cautiously because Broken Board contains only **four anomalous clips**, making the estimate highly variable. It also suggests a signal-level explanation: a broken board can produce one abrupt transient, whereas the Fourier inductive bias is especially effective for recurring or rhythmically distributed disturbances.

## Anomaly scores can also reveal *when* something went wrong

The paper goes beyond clip-level AUC and inspects the time distribution of reconstruction errors.

{% include publication-figure.liquid
  src="/assets/img/publications/cae-fno/reconstruction-error-profiles.png"
  href="/assets/img/publications/cae-fno/reconstruction-error-profiles.png"
  alt="Reconstruction-error profiles comparing Skip-CAE-Transformer and CAE-FNO"
  caption="Representative fault recordings. CAE-FNO produces repeated, temporally distributed error peaks for uneven/thick-wood and board-stuck faults rather than concentrating nearly all response in one dominant event."
  credit="Reconstruction-error figure from the MMSP 2026 manuscript"
  wide=true
%}

The comparison is qualitative because the two models reconstruct different representations:

- Skip-CAE-Transformer reconstructs mel spectrograms;
- CAE-FNO reconstructs raw waveforms.

So the absolute error values are not directly compared.

The important observation is the **temporal pattern**.

CAE-FNO often produces multiple localized peaks across a faulty recording, suggesting that it captures recurring disruptions of the learned machine rhythm rather than only isolated high-energy events.

## Why this fits the FNO inductive bias

A planer in normal operation produces repeated acoustic structure.

A periodic fault does not necessarily create one huge impulse. It may alter the rhythm repeatedly across a ten-second recording.

Because CAE-FNO learns globally shared Fourier modes, deviations in spectral regularity can appear as distributed reconstruction failures throughout time.

The local Conv1d branch then complements that global signal by preserving fine waveform structure.

The architecture therefore explicitly combines:

> **global rhythm + local transient structure**

inside every processing block.

## What the results do *not* claim

The paper does not claim that Fourier operators solve every acoustic anomaly equally well.

The Broken Board result is a useful counterexample: rare, abrupt transient anomalies may be less aligned with the model's strongest inductive bias.

Likewise, the evaluation is currently limited to one industrial machine family.

Future validation across additional machines and anomaly types is necessary before drawing broad claims about industrial acoustic monitoring.

## Takeaway

CAE-FNO treats industrial acoustic anomaly detection as learning the normal **rhythm of a machine**.

A conventional autoencoder asks whether the input can be reconstructed.

CAE-FNO adds a stronger structural prior:

- the Fourier branch learns which signal-wide frequencies should coexist;
- the convolutional branch learns which local waveform structures should occur;
- reconstruction error reveals both whether a recording is abnormal and where the learned pattern breaks.

On the wood-planer benchmark, this produces **0.918 AUC** and **0.799 pAUC**, outperforming the previous reported baselines while also exposing temporally distributed fault signatures directly in the raw waveform.
