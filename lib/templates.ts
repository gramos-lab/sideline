export interface SessionLine {
  day: string;
  time: string;
  program: string;
  location: string;
}

export const templates = {
  initial: (firstName: string, sessions: SessionLine[], clubName: string) =>
    `Hey ${firstName} — you're scheduled this week:\n` +
    sessions.map((s) => `${s.day} ${s.time} ${s.program} at ${s.location}`).join('\n') +
    `\nReply YES to confirm. — ${clubName}`,

  reminder: (firstName: string, session: SessionLine, clubName: string) =>
    `Hey ${firstName} — reminder, tomorrow ${session.time} ${session.program} at ${session.location}. ` +
    `Reply YES to lock in or NO if anything changed. — ${clubName}`,

  cascadeAsk: (firstName: string, session: SessionLine, clubName: string) =>
    `Hey ${firstName} — covering for someone: ${session.day} ${session.time} ${session.program} at ${session.location}. ` +
    `Reply YES to take it, NO to pass. — ${clubName}`,

  cascadeStandDown: (firstName: string, clubName: string) =>
    `Hey ${firstName} — coverage filled, you're off the hook. Thanks. — ${clubName}`,

  cascadeConfirmed: (firstName: string, session: SessionLine, clubName: string) =>
    `Locked in — thanks ${firstName}. ${session.day} ${session.time} ${session.program} at ${session.location}. — ${clubName}`,

  unknownSenderEscalation: (phone: string, body: string) =>
    `Sideline: unknown sender ${phone} sent: "${body.slice(0, 140)}"`,

  loopAlert: (phone: string) =>
    `Sideline loop guard tripped for ${phone} — outbound paused, please review.`,
};
