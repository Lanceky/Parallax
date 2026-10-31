import { NextResponse } from "next/server";
import { outcomeWasRight, updateSelfTrust, type OutcomeValue } from "@/lib/outcomes";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      eraId?: string;
      domain?: string;
      outcome?: OutcomeValue;
      vote?: "love" | "meh" | "no";
      alpha?: number;
      beta?: number;
    };

    if (!body.eraId || !body.domain || !body.outcome || !body.vote) {
      return NextResponse.json({ error: "eraId, domain, outcome, and vote are required." }, { status: 400 });
    }

    return NextResponse.json({
      trust: updateSelfTrust({
        eraId: body.eraId,
        domain: body.domain,
        wasRight: outcomeWasRight(body.outcome, body.vote),
        current: {
          alpha: body.alpha ?? 1,
          beta: body.beta ?? 1,
        },
      }),
    });
  } catch (error) {
    console.error("Outcome request failed", error);
    return NextResponse.json({ error: "Outcome could not be recorded." }, { status: 400 });
  }
}
