import moment from "moment";
import { Duration } from "moment";

export function humanizeMillisForDebug(millis: number): unknown[] {
  return humanizeForDebug(moment.duration(millis, "ms"));
}

export function humanizeForDebug(duration: Duration): unknown[] {
  const humanizedSegments: unknown[] = [];
  if (Math.floor(duration.asDays()) > 0)
    humanizedSegments.push(Math.floor(duration.asDays()), "days");
  if (Math.floor(duration.asHours()) > 0)
    humanizedSegments.push(Math.floor(duration.hours()), "hours");
  if (Math.floor(duration.asMinutes()) > 0)
    humanizedSegments.push(Math.floor(duration.minutes()), "minutes");
  humanizedSegments.push(Math.floor(duration.seconds()), "seconds");

  return humanizedSegments;
}