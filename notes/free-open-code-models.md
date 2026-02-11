# Free OpenCode Models

1. DeepSeek V4.1 Flash. It scores 74.2% on DeepSWE, ranking 5th of 52 models on that benchmark. It is also listed at 90.6 on Terminal-Bench 2.1.
2. MiMo-V2.6-Flash. It scores 67.9 on DeepSWE and 87.6 on Terminal-Bench.
3. GLM-5.3-Flash. It scores 84.3 on Terminal-Bench 2.1 and 63.4 on DeepSWE v1.1. Its 92.0% on Vals AI’s independent SWE-bench run is the best independently run number in this group. The top three are close, and you could reasonably order them differently.
4. Beam. It reports 81.6 on SWE-bench Verified and 80.1 on Terminal-Bench 2.1. Its DeepSWE score is only 44.4, well behind the top three on the harder benchmark.
5. Flint 40B. Its self-reported scores are 74.2% on SWE-bench Verified and 54.9% on Terminal-Bench 2.1, with no independent verification. That is good for a small model with about 2.5B active parameters, but it trails the models above.
6. Big Pickle. An independent run scored it 50.8% on SWE Atlas Codebase QnA, ahead of GLM 5.2 and GPT-5.6-Sol on the same scaffold. That was a single trial, and the model behind the alias may have changed since, so its position is low confidence.
7. Nemotron 3.5 Super VL. I found no solid coding scores. Nvidia positions it for multimodal agent tasks like tool use and business workflows. This placement is mostly a guess.
8. Nemotron 3.5 Lightning. It has a coding score of 26.8, at the 41st percentile. It is a small 30B model with 3B active parameters, so it is the weakest here.

Not ranked: Pulse Alpha. It is a stealth model released on November 2, with no public benchmark data yet.
