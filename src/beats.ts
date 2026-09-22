import { getCollection, getEntry } from "astro:content";
import type { Beat } from "./session";

function fromLine(transcript: string, line: string): string {
  return transcript.slice(transcript.indexOf(line));
}

export async function loadBeats(): Promise<Beat[]> {
  const entries = (await getCollection("beats")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const beats: Beat[] = [];
  for (const [index, { data }] of entries.entries()) {
    const comparison =
      data.comparison && (await getEntry(data.comparison))?.data;
    const transcript = (data.transcript ?? comparison?.martin ?? "").trim();
    const opening = data.continues ? beats[index - 1] : undefined;
    beats.push({
      section: data.section,
      session: opening ? opening.session : index,
      title: opening ? opening.title : (data.title ?? ""),
      command: opening ? opening.command : (data.command ?? "").trim(),
      transcript: data.startAt
        ? fromLine(transcript, data.startAt)
        : transcript,
      continues: data.continues,
      inlineOnPhone: data.inlineOnPhone,
    });
  }
  return beats;
}
