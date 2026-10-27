import { z } from "zod";
import { businessModel } from "@/lib/business";
import { platformSupportTicketModel } from "@/lib/platform-console";
import { fail, handleError, ok } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/super-admin";

const ticketSchema = z.object({ businessId: z.string().regex(/^[a-f\d]{24}$/i), subject: z.string().trim().min(3).max(160), message: z.string().trim().max(4000).default(""), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium") });

export async function GET() { try { await requireSuperAdmin(); const Ticket = await platformSupportTicketModel(); return ok(await Ticket.find().populate("business", "name slug").sort({ createdAt: -1 }).lean()); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { await requireSuperAdmin(); const data = ticketSchema.parse(await request.json()); const Business = await businessModel(); if (!await Business.exists({ _id: data.businessId, provisioned: true })) return fail("Tenant not found", 404); const Ticket = await platformSupportTicketModel(); return ok(await Ticket.create({ business: data.businessId, subject: data.subject, message: data.message, priority: data.priority }), 201); } catch (error) { return handleError(error); } }
export async function PATCH(request: Request) { try { await requireSuperAdmin(); const data = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["open", "in_progress", "resolved", "closed"]) }).parse(await request.json()); const Ticket = await platformSupportTicketModel(); const ticket = await Ticket.findByIdAndUpdate(data.id, { status: data.status }, { new: true }).populate("business", "name slug").lean(); return ticket ? ok(ticket) : fail("Support ticket not found", 404); } catch (error) { return handleError(error); } }
