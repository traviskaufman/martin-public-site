import { getCollection, getEntry } from "astro:content";

export type Scene = {
  section: string;
  title: string;
  command: string;
  transcript: string;
  entry: "playing" | "finished";
  differentiator?: string;
};

function fromLine(transcript: string, line: string): string {
  return transcript.slice(transcript.indexOf(line));
}

export async function loadScenes(): Promise<Scene[]> {
  const entries = (await getCollection("scenes")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  return Promise.all(
    entries.map(async ({ data }) => {
      const comparison =
        data.comparison && (await getEntry(data.comparison))?.data;
      const transcript = (data.transcript ?? comparison?.martin ?? "").trim();
      return {
        section: data.section,
        title: data.title,
        command: (data.command ?? comparison?.prompt ?? "").trim(),
        transcript: data.startAt
          ? fromLine(transcript, data.startAt)
          : transcript,
        entry: data.entry,
        differentiator: data.differentiator ?? comparison?.differentiator,
      };
    }),
  );
}
