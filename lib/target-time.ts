export type TargetTimeInput = {
  hours: string;
  minutes: string;
  seconds: string;
};

export type ParsedTargetTime =
  | {
      status: "empty";
      errorMessage: null;
      totalSeconds: null;
    }
  | {
      status: "invalid";
      errorMessage: string;
      totalSeconds: null;
    }
  | {
      status: "valid";
      errorMessage: null;
      totalSeconds: number;
    };

export function parseTargetTimeInput(
  input: TargetTimeInput,
): ParsedTargetTime {
  const hasAnyValue = Object.values(input).some((value) => value.length > 0);

  if (!hasAnyValue) {
    return {
      status: "empty",
      errorMessage: null,
      totalSeconds: null,
    };
  }

  const hours = input.hours === "" ? 0 : Number.parseInt(input.hours, 10);
  const minutes = input.minutes === "" ? 0 : Number.parseInt(input.minutes, 10);
  const seconds = input.seconds === "" ? 0 : Number.parseInt(input.seconds, 10);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds)
  ) {
    return {
      status: "invalid",
      errorMessage: "Only numeric values are allowed for the target time.",
      totalSeconds: null,
    };
  }

  if (minutes > 59 || seconds > 59) {
    return {
      status: "invalid",
      errorMessage: "Minutes and seconds must stay between 00 and 59.",
      totalSeconds: null,
    };
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds <= 0) {
    return {
      status: "invalid",
      errorMessage: "Enter a target time greater than zero.",
      totalSeconds: null,
    };
  }

  return {
    status: "valid",
    errorMessage: null,
    totalSeconds,
  };
}
