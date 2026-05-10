import { generateContent } from '../config/gemini.js';
import { buildPrompt, detectSource } from '../utils/promptBuilder.js';
import { PromptModel } from '../models/models.js';
import { success, AppError } from '../utils/apiResponse.js';

export const askQuestion = async (req, res, next) => {
  try {
    const q = req.body.question?.trim();
    if (!q) throw new AppError('Question cannot be empty.', 400);
    const prompt = await buildPrompt(q);
    const answer = await generateContent(prompt);
    const source = detectSource(answer);
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
