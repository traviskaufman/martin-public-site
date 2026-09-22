export type Beat = {
  section: string;
  session: number;
  title: string;
  command: string;
  transcript: string;
  continues: boolean;
  inlineOnPhone: boolean;
};

export function sessionBeats(beats: Beat[], index: number): Beat[] {
  return beats
    .slice(beats[index].session, index + 1)
    .filter((beat) => beat.transcript);
}

export function sessionEnd(beats: Beat[], index: number): number {
  const session = beats[index].session;
  return beats.findLastIndex((beat) => beat.session === session);
}

export function asOwnSession(beats: Beat[], index: number): Beat {
  const beat = beats[index];
  const opening = beats[beat.session];
  return {
    ...beat,
    session: 0,
    continues: false,
    title: opening.title,
    command: opening.command,
  };
}
