---
theme: seriph
title: Agentic Engineering
info: false
class: text-center
transition: slide-left
mdc: true
---

# Agentic Engineering

Turning a codebase agents *can't* work in
into one they *can*

<div class="pt-12 opacity-70 text-base">
  Juan Cruz Fortunatti
</div>

---
layout: intro
---

# Juan Cruz Fortunatti

<div class="text-xl opacity-80 pt-2">Agentic AI Engineer @ Delivery Hero</div>

<div class="pt-5 text-lg opacity-80">

building multi-agent systems for restaurants & agentic evals

</div>

<div class="pt-4 text-base opacity-60">

coffee nerd · passionate about coding and building stuff

</div>

<div class="abs-br m-8 text-sm opacity-60 flex items-center gap-4">
  <span>ledeluge.me</span>
  <span class="flex items-center gap-1"><carbon-logo-x class="text-base" /> jcfortunatti</span>
</div>

---
layout: center
class: text-center
---

# What is agentic engineering?

<div v-click class="pt-6 text-2xl font-medium opacity-90">

It's not about the prompt.

</div>

<div v-click class="pt-12">

<div class="text-sm uppercase tracking-widest opacity-45">the system around the model</div>

<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-5">
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Context</div>
    <div class="text-sm opacity-50 pt-1">docs & plans</div>
  </div>
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Constraints</div>
    <div class="text-sm opacity-50 pt-1">tests</div>
  </div>
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Feedback</div>
    <div class="text-sm opacity-50 pt-1">evals & screenshots</div>
  </div>
</div>

</div>

<div v-click class="pt-12 text-sm opacity-45">
same model, different engineering
</div>

---

# Vibe coding vs. agentic engineering

<div grid="~ cols-2 gap-6" class="pt-6">

<div class="rounded-xl border border-red-400/30 bg-red-400/5 p-6 leading-loose">

### 🎲 Vibe coding

prompt → accept → ship

you **eyeball** the output

ground truth: **vibes**

optimizes for the **demo**

</div>

<div class="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-6 leading-loose">

### 🛠️ Agentic engineering

<span class="px-2 py-0.5 rounded bg-emerald-400/15 whitespace-nowrap">prompt → plan → verify ↻</span> → merge

you review the **plan & diff**

ground truth: **tests & evals**

optimizes for the **diff you'd merge**

</div>

</div>

<div v-click class="pt-8 text-center text-lg">

One question tells them apart: <strong>"where's the ground truth the agent checks itself against?"</strong>

</div>

---
layout: center
class: text-center
---

## Why legacy code resists agents

<div class="pt-8 text-xl max-w-2xl mx-auto leading-relaxed">

It's missing three things:

<div class="pt-6 flex justify-center gap-10 text-2xl font-semibold">
<span v-click>Direction</span>
<span v-click>A safety net</span>
<span v-click>Feedback</span>
</div>

</div>

<div v-click class="pt-12 opacity-80">

So we add them back, in that order.

</div>

---
layout: section
---

# First · Plan it

before any move

---
layout: center
class: text-center
---

# Build the plan, in three phases

<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-6">
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Understand</div>
    <div class="text-sm opacity-50 pt-1">map + diagram</div>
  </div>
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Decide</div>
    <div class="text-sm opacity-50 pt-1">options + standards</div>
  </div>
  <div class="py-4 rounded-xl bg-gray-500/10 border border-gray-500/15">
    <div class="text-lg font-semibold">Iterate</div>
    <div class="text-sm opacity-50 pt-1">review + refine</div>
  </div>
</div>

<div v-click class="pt-8">

<pre class="inline-block text-sm font-mono opacity-70 text-left leading-tight m-0">
┌─────────┐    ┌────────┐    ┌──────────┐
│  pages  │───►│  api   │───►│  prisma  │
└─────────┘    └────────┘    └──────────┘
</pre>

<div class="text-xs opacity-60 pt-2">ask for ASCII diagrams of current + target flows</div>

</div>

<div v-click class="pt-6 text-base opacity-60">

→ <code>PLAN.md</code>, the north star for the four moves

</div>

---
layout: section
---

# Move 1 · Pin it

tests before anything moves

---
layout: center
class: text-center
---

# Pin the behavior, then change it

<div v-click class="pt-8 text-xl opacity-90">

snapshot what the code does <strong>today</strong>, bugs and all

</div>

<div v-click class="pt-5 text-xl opacity-90">

then refactor freely, the tests catch any drift

</div>

<div v-click class="pt-12 text-lg">

🔴 &nbsp; <strong>Live:</strong> a test goes red. intended change, or regression?

</div>

---
layout: section
---

# Move 2 · Tutor it

`.md` files as the **target** the code grows toward

---

# A tutor keeps growth straight

<div grid="~ cols-[38%_62%] gap-10" class="pt-2 items-center">

<img src="./assets/tutor.png" class="rounded-lg shadow-xl max-h-95 mx-auto" />

<div class="leading-relaxed">

In the garden, a **tutor** is a stake you tie a young tree to
so it grows **straight** instead of crooked.

<div class="pt-4">

It doesn't grow the tree.
It **steers the direction** of growth.

</div>

</div>

</div>

---
layout: center
---

# Same idea, for your codebase

<div grid="~ cols-[42%_58%] gap-10" class="items-center">

<img src="./assets/tutor-markdown.png" class="rounded-lg shadow-2xl max-h-100 mx-auto" />

<div class="leading-relaxed">

`AGENTS.md` / `CLAUDE.md` are tutors for your repo.

They describe the **target** shape of each folder.
The migration moves the code toward them.

<div v-click class="pt-6 text-sm opacity-70">

Tool-agnostic: `AGENTS.md` is the open standard, `CLAUDE.md` is what Claude Code reads. The tutor is the idea; the filename is just which gardener reads the label.

</div>

</div>

</div>

---
layout: center
---

# Two ways to plant a tutor

<div grid="~ cols-2 gap-10" class="pt-6">

<div>

### 🌰 Seed it

Greenfield project.
Plant the tutor **with** the seed →
it grows straight from day one.

</div>

<div>

### 🌳 Stake a grown tree

Legacy codebase.
The tutor sets the target.
The next migration steers toward it.

</div>

</div>

<div v-click class="pt-12 text-center text-xl">

🔴 &nbsp; **Live:** seed `hacker-prode`'s target tutors

</div>

---
layout: section
---

# Move 3 · Migrate

converge on the tutors, module by module

---
layout: center
class: text-center
---

# Migrate, module by module

<div v-click class="pt-8 text-xl opacity-90">

each PR moves one slice toward its tutor

</div>

<div v-click class="pt-5 text-xl opacity-90">

the <strong>tests</strong> prove nothing broke

</div>

<div v-click class="pt-5 text-lg opacity-70">

small enough that the human can review the diff

</div>

<div v-click class="pt-10 text-lg">

🔴 &nbsp; <strong>Live:</strong> a module converges. tests verify. diff reviewed.

</div>

---
layout: section
---

# Move 4 · Give it eyes

Close the feedback loop

---
layout: center
class: text-center
---

# The agent can't fix what it can't see

<div v-click class="pt-8 text-xl opacity-90">

by default, it's typing <strong>blind</strong>

</div>

<div v-click class="pt-5 text-xl opacity-90">

a harness gives it eyes: screenshots, a running app

</div>

<div v-click class="pt-5 text-lg opacity-70">

now a redesign is safe to hand off

</div>

<div v-click class="pt-10 text-lg">

🔴 &nbsp; <strong>Live:</strong> screenshot → restyle → screenshot again

</div>

---
layout: center
class: text-center
---

# Q&A

---
layout: section
---

# Your turn

30 minutes, in small groups

---

# Pick a move and try it

<div grid="~ cols-2 gap-4" class="pt-4 text-sm">

<div>

### 📌 Pin
Write one characterization test.

**Done =** it goes green, then catches a change.

</div>

<div>

### 🌱 Tutor
Write an `AGENTS.md` for a module: the **target** shape.

**Done =** 1 target convention + 1 retained warning.

</div>

<div>

### 🔁 Migrate
Apply one tutor convention to one module.

**Done =** tests stay green, diff fits one PR.

</div>

<div>

### 👁️ Eyes
Restyle one screen with a screenshot loop.

**Done =** before / after, agent-driven.

</div>

</div>

<div v-click class="pt-6 text-center opacity-85">

Or introduce a small feature using any of the four.
Then come back and tell us **what surprised you.**

</div>

---
layout: center
class: text-center
---

<div class="text-xl opacity-30 tracking-wide">
vibe coding trusts the output
</div>

<div class="pt-12 text-5xl font-bold leading-tight">
agentic engineering
</div>

<div class="text-5xl font-bold leading-tight pt-1">
<span class="italic text-emerald-400">verifies</span> it
</div>

<div class="pt-16 text-sm opacity-50 max-w-md mx-auto">
the engineering is the scaffolding that makes verification automatic
</div>

---
layout: center
class: text-center
---

# thanks

<div class="pt-12 text-base opacity-70 flex items-center justify-center gap-5">
  <span>ledeluge.me</span>
  <span class="opacity-40">·</span>
  <span class="flex items-center gap-1.5"><carbon-logo-x class="text-base" /> jcfortunatti</span>
</div>
