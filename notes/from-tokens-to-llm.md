# From Tokens to ChatGPT

A step-by-step build-up of how a sentence becomes a transformer, and how a transformer becomes ChatGPT. Each step adds one idea to the previous one.

## The short version

Sentence → tokens → embeddings → queries, keys, values → attention scores → attention weights → context → self-attention → transformer block → transformer → ChatGPT

## The steps

### 1. Tokens

Break a sentence into pieces and you get **tokens**.

### 2. Embeddings

Turn each token into a list of numbers and you get an **embedding**.

### 3. Queries

Make every token ask a question to every token and you get a **query**.

### 4. Keys and values

Give every token a way to answer that question and you get a **key** and a **value**.

### 5. Attention scores

Compare one token's query to every other token's key and you get **attention scores**.

### 6. Attention weights

Turn those scores into percentages and you get **attention weights**.

### 7. Context

Use those weights to combine values and you get **context**.

### 8. Self-attention

Have every token do this for every other token and you get **self-attention**.

### 9. Transformer block

Combine self-attention with a neural network and you get a **transformer block**.

### 10. Transformer

Stack those blocks and you get a **transformer**.

### 11. ChatGPT

Train the transformer to generate text, then fine-tune it with human feedback, and you get **ChatGPT**.

## Glossary

| Term              | What it is                                                         |
| ----------------- | ------------------------------------------------------------------ |
| Token             | A piece of a sentence                                              |
| Embedding         | A token represented as a list of numbers                           |
| Query             | The "question" a token asks every token                            |
| Key               | What a token offers so others can match their questions against it |
| Value             | The information a token contributes when it is matched             |
| Attention score   | How well one token's query matches another token's key             |
| Attention weight  | An attention score turned into a percentage                        |
| Context           | The weighted combination of values                                 |
| Self-attention    | Every token attending to every other token                         |
| Transformer block | Self-attention combined with a neural network                      |
| Transformer       | A stack of transformer blocks                                      |

## Closing thought

Rewind all of it and you are back to a sentence.
