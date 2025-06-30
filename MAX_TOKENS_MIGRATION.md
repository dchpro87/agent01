# Max Tokens vs Num Predict - Migration Summary

## ✅ **You are absolutely correct!**

Since you're using the AI SDK with the OpenAI provider (even though connecting to Ollama), you should follow **AI SDK conventions** and use `maxTokens` instead of Ollama's native `num_predict`.

## 🔄 **Changes Made**

### 1. **Updated Types** (`src/types/ollama.ts`)
```typescript
export interface OllamaModelOptions {
  // Token control - AI SDK standard
  maxTokens?: number; // Maximum tokens to generate (AI SDK standard)
  num_predict?: number; // Ollama native - for backward compatibility
  // ... other options
}
```

### 2. **Updated Presets** (`src/types/ollama.ts`)
All presets now use `maxTokens` instead of `num_predict`:
```typescript
export const MODEL_PRESETS = {
  balanced: {
    // ...
    maxTokens: 1024, // AI SDK standard
  },
  coding: {
    // ...
    maxTokens: 2048, // Higher for code generation
  },
  // ... other presets
};
```

### 3. **Updated API Route** (`src/app/api/chat/route.ts`)
```typescript
// AI SDK standard: maxTokens (replaces Ollama's num_predict)
...(finalOptions.maxTokens && { maxTokens: finalOptions.maxTokens }),
// Support legacy num_predict for backward compatibility
...(!finalOptions.maxTokens && finalOptions.num_predict && { maxTokens: finalOptions.num_predict }),
```

### 4. **Updated UI Component** (`src/components/ModelConfigSelector.tsx`)
- Changed "Tokens to Generate" to "Max Tokens"
- Updated label and description to be more accurate
- Now uses `maxTokens` parameter

### 5. **Updated Configuration** (`src/lib/ai-config.ts`)
```typescript
defaultOptions: {
  // ...
  maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || process.env.OLLAMA_NUM_PREDICT || "512"),
},
```

## 🔄 **Parameter Flow**

### Before (Ollama-specific):
```
UI: num_predict → API: providerOptions.openai.num_predict → Ollama
```

### After (AI SDK standard):
```
UI: maxTokens → API: maxTokens → AI SDK → Ollama (auto-converted to num_predict)
```

## 🔄 **Backward Compatibility**

The implementation maintains backward compatibility:
- If `maxTokens` is provided, it's used as the AI SDK standard
- If only `num_predict` is provided (legacy), it's mapped to `maxTokens`
- Both environment variables are supported: `OLLAMA_MAX_TOKENS` and `OLLAMA_NUM_PREDICT`

## 📚 **Why This Matters**

1. **Standards Compliance**: Following AI SDK conventions ensures your code works correctly with the framework
2. **Future-Proofing**: AI SDK handles provider-specific translations automatically
3. **Consistency**: Using standard parameter names makes your code more maintainable
4. **Better Abstraction**: The AI SDK abstracts away provider-specific differences

## 🔧 **Environment Variables**

You can now use either:
```bash
# Preferred (AI SDK standard)
OLLAMA_MAX_TOKENS=1024

# Legacy (still supported)
OLLAMA_NUM_PREDICT=1024
```

## ✅ **What This Fixes**

- **Correct Terminology**: UI now shows "Max Tokens" which is the standard term
- **Proper Parameter Mapping**: `maxTokens` is passed directly to AI SDK, not via `providerOptions`
- **Framework Compliance**: Following AI SDK best practices
- **Better User Experience**: Users see familiar terminology from other AI services

Your intuition was spot-on! The AI SDK is designed to abstract away provider-specific differences, and `maxTokens` is the standard parameter that gets automatically translated to whatever the underlying provider expects (in Ollama's case, `num_predict`).
