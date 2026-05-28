export function formError(error: string) {
  switch (error) {
    case "SUBMISSION_EXPIRED":
      return "El tiempo para crear un prode ha finalizado.";
    default:
      return "";
  }
}
