import { Prode, ProdeRoom, User } from '@/generated/prisma';

export function redirectToResults(room: ProdeRoom, locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/${room.id}/results`,
      permanent: false,
    },
  };
}

export function redirectToGroups(locale?: string, room?: ProdeRoom) {
  return {
    redirect: {
      destination: !room
        ? `${locale ? `/${locale}` : ""}/groups`
        : `${locale ? `/${locale}` : ""}/${room.id}/groups`,
      permanent: false,
    },
  };
}

export function redirectToFinals(locale?: string, room?: ProdeRoom) {
  return {
    redirect: {
      destination: !room
        ? `${locale ? `/${locale}` : ""}/finals`
        : `${locale ? `/${locale}` : ""}/${room.id}/finals`,
      permanent: false,
    },
  };
}

export function redirectToLogin(locale?: string, callbackUrl?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/login${
        callbackUrl ? `?callbackUrl=${callbackUrl}` : ""
      }`,
      permanent: false,
    },
  };
}

export function redirectToBlocked(locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/blocked`,
      permanent: false,
    },
  };
}

export function redirectToRoot(locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/`,
      permanent: false,
    },
  };
}

export function redirectToRooms(locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/rooms`,
      permanent: false,
    },
  };
}

export function shouldPasswordCheck(room: ProdeRoom) {
  return !!room.password;
}

export function roomEmailCheck(room: ProdeRoom, user: User) {
  return (
    !room.emailDomain ||
    (!!user.email && !!user.email.endsWith(`@${room.emailDomain}`))
  );
}

export function redirectToPasswordCheck(room: ProdeRoom, locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/${room.id}/checkpassword`,
      permanent: false,
    },
  };
}

export function redirectToRanking(room: ProdeRoom, locale?: string) {
  return {
    redirect: {
      destination: `${locale ? `/${locale}` : ""}/${room.id}/ranking`,
      permanent: false,
    },
  };
}
