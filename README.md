# Deduct

A project to imitate [Deduct Layer in wxyhly's deductrium](https://github.com/wxyhly/deductrium) in CLI form.

## Usage

### REPL Commands

help: Display the help

exit: Exit the program

#### Rules

rules: List all rules

save: Save rules

load: Load rules

metarule: Use Metarules
- `mcdt`: Use Meta Condition Deduct Theorem
- > e.g. `(|- $0>$1>$2) |-M (|-$3>$0>$1>$2)`;`($2 |- $0>$1>$2) |-M ($3>$2 |-$3>$0>$1>$2)`
- `mdt`: Use Meta Deduct Theorem
- > e.g. `($3, $2|- $0>$1) |-M ($3 |- $2>$0>$1)`
- `midt`: Use Meta Inverse Deduct Theorem
- > e.g. `(|- $0>$1>$2) |- M($0|$1>$2)`
- `mq`: Use First Logic Axiom Schema (Only applies to axioms and definitions without conditions)
- > e.g. `(|- $0>$1>$0) |- M (V#$0:($0>$1>$0))`


#### Propositions

pop: Pop a proposition

clear: Clear propositions

list: List all propositions

hyp: Create hypothesis

- .exit: Exit hypothesis
- .pop: Pop a hypothesis

theorem: Create theorem, hypothesis as conditions, last theorem as conclusion.

- `stepId` points to a theorem and it will be a conclusion.

mv: Move a proposition to destination




#### Tests

testmdt: Test Meta Deduct Theorem for appliable rules



## Run

Run test: `deno --allow-env --sloppy-imports --allow-write --allow-read test/test1.test.ts` (Currently open the repl)


## Builtin axioms & definitions

`mp, a1, a2, a3, d<>1, d<>2, d|, d&, a5, a7`

## Builtin Meta-Theorems

- `midt` (Used by `<`+Rule)
- `mcdt` (Used by `c`+Rule)
- `mdt` (Used by `>`+Rule)

## TODO List:

Meta Theorems `mq`, `mcvt`, `mvt`, `mcpt`

Axioms & Definitions `a4, a6, a8, dE, ...`

Peano

ZFC set theory
