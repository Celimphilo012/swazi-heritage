import { generateContent } from '../config/gemini.js';
import { buildPrompt, detectSource } from '../utils/promptBuilder.js';
import { isOllamaAvailable, generateWithOllama, buildRagPrompt } from '../config/ollama.js';
import { getRelevantDocs, predictAnswer } from '../ml/predictor.js';
import { answerLocally } from '../utils/localNLP.js';
import { PromptModel } from '../models/models.js';
import { success, AppError } from '../utils/apiResponse.js';

export const askQuestion = async (req, res, next) => {
  try {
    const q = req.body.question?.trim();
    if (!q) throw new AppError('Question cannot be empty.', 400);

    let answer, source;

    // ── 1. Gemini (primary) ──────────────────────────────────────────────────
    try {
      const prompt = await buildPrompt(q);
      answer = await generateContent(prompt);
      source = detectSource(answer);
    } catch {

      // ── 2. Ollama + RAG (first fallback) ──────────────────────────────────
      try {
        if (await isOllamaAvailable()) {
          const docs = getRelevantDocs(q, 4);
          const systemPrompt = buildRagPrompt(docs);
          answer = await generateWithOllama(systemPrompt, q);
          source = 'local';
        } else {
          throw new Error('Ollama not running');
        }
      } catch {

        // ── 3. Trained ML model (second fallback) ─────────────────────────
        const ml = predictAnswer(q);
        if (ml) {
          ({ answer, source } = ml);
        } else {
          // ── 4. Keyword search (last resort) ───────────────────────────
          ({ answer, source } = await answerLocally(q));
        }
      }
    }

    await PromptModel.save({ user_id: req.user.id, question: q, answer, source });
    success(res, { question: q, answer, source });
  } catch (err) { next(err); }
};

export const getMyHistory = async (req, res, next) => {
  try { success(res, await PromptModel.findByUser(req.user.id, 50)); } catch (err) { next(err); }
};

export const getAllPrompts = async (req, res, next) => {
  try { success(res, await PromptModel.getAll({ page: +req.query.page || 1, limit: +req.query.limit || 30 })); } catch (err) { next(err); }
};
