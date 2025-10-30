/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation ClockInMutation($input: ClockInInput!) {\n  clockIn(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}": typeof types.ClockInMutationDocument,
    "query VehiclesQuery {\n  vehicles {\n    id\n    globalId\n    make\n    model\n    licensePlate\n    yearOfManufacture\n    displayName\n    latestOdometer\n    latestRange\n    telematicsSource\n    createdAt\n    updatedAt\n  }\n}": typeof types.VehiclesQueryDocument,
    "mutation ClockOutMutation($input: ClockOutInput!) {\n  clockOut(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}": typeof types.ClockOutMutationDocument,
    "query CurrentShiftQuery {\n  currentShift {\n    ...CurrentShiftFragment\n  }\n}\n\nfragment CurrentShiftFragment on ShiftAssignment {\n  id\n  status\n  city\n  startTime\n  endTime\n  driver {\n    id\n    fullName\n    email\n  }\n  vehicle {\n    id\n    licensePlate\n    model\n    yearOfManufacture\n    latestOdometer\n    latestRange\n  }\n  shiftEvents {\n    id\n    eventType\n    odometer\n    vehicleRange\n    gpsLat\n    gpsLon\n    notes\n    createdAt\n  }\n}": typeof types.CurrentShiftQueryDocument,
    "mutation CreateSessionMutation($input: CreateSessionInput!) {\n  createSession(input: $input) {\n    user {\n      id\n      email\n      firstName\n      lastName\n      fullName\n      driver {\n        id\n        fullName\n      }\n    }\n    authToken {\n      accessToken\n      refreshToken\n      tokenType\n      expiresIn\n    }\n    errors {\n      message\n      code\n      field\n    }\n  }\n}": typeof types.CreateSessionMutationDocument,
    "query TodayShiftsQuery {\n  todayShifts {\n    id\n    globalId\n    city\n    startTime\n    actualStartTime\n    endTime\n    actualEndTime\n    status\n    recurrenceRule\n    driver {\n      id\n      globalId\n      fullName\n      email\n      phoneNumber\n      createdAt\n    }\n    vehicle {\n      id\n      globalId\n      licensePlate\n      model\n      make\n      yearOfManufacture\n      latestOdometer\n      displayName\n      latestRange\n      telematicsSource\n    }\n    shiftEvents {\n      id\n      globalId\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      createdAt\n    }\n    revenueRecords {\n      id\n      globalId\n      totalRevenue\n      totalProfit\n      reconciled\n      createdAt\n    }\n    createdAt\n    updatedAt\n  }\n}": typeof types.TodayShiftsQueryDocument,
};
const documents: Documents = {
    "mutation ClockInMutation($input: ClockInInput!) {\n  clockIn(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}": types.ClockInMutationDocument,
    "query VehiclesQuery {\n  vehicles {\n    id\n    globalId\n    make\n    model\n    licensePlate\n    yearOfManufacture\n    displayName\n    latestOdometer\n    latestRange\n    telematicsSource\n    createdAt\n    updatedAt\n  }\n}": types.VehiclesQueryDocument,
    "mutation ClockOutMutation($input: ClockOutInput!) {\n  clockOut(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}": types.ClockOutMutationDocument,
    "query CurrentShiftQuery {\n  currentShift {\n    ...CurrentShiftFragment\n  }\n}\n\nfragment CurrentShiftFragment on ShiftAssignment {\n  id\n  status\n  city\n  startTime\n  endTime\n  driver {\n    id\n    fullName\n    email\n  }\n  vehicle {\n    id\n    licensePlate\n    model\n    yearOfManufacture\n    latestOdometer\n    latestRange\n  }\n  shiftEvents {\n    id\n    eventType\n    odometer\n    vehicleRange\n    gpsLat\n    gpsLon\n    notes\n    createdAt\n  }\n}": types.CurrentShiftQueryDocument,
    "mutation CreateSessionMutation($input: CreateSessionInput!) {\n  createSession(input: $input) {\n    user {\n      id\n      email\n      firstName\n      lastName\n      fullName\n      driver {\n        id\n        fullName\n      }\n    }\n    authToken {\n      accessToken\n      refreshToken\n      tokenType\n      expiresIn\n    }\n    errors {\n      message\n      code\n      field\n    }\n  }\n}": types.CreateSessionMutationDocument,
    "query TodayShiftsQuery {\n  todayShifts {\n    id\n    globalId\n    city\n    startTime\n    actualStartTime\n    endTime\n    actualEndTime\n    status\n    recurrenceRule\n    driver {\n      id\n      globalId\n      fullName\n      email\n      phoneNumber\n      createdAt\n    }\n    vehicle {\n      id\n      globalId\n      licensePlate\n      model\n      make\n      yearOfManufacture\n      latestOdometer\n      displayName\n      latestRange\n      telematicsSource\n    }\n    shiftEvents {\n      id\n      globalId\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      createdAt\n    }\n    revenueRecords {\n      id\n      globalId\n      totalRevenue\n      totalProfit\n      reconciled\n      createdAt\n    }\n    createdAt\n    updatedAt\n  }\n}": types.TodayShiftsQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ClockInMutation($input: ClockInInput!) {\n  clockIn(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}"): (typeof documents)["mutation ClockInMutation($input: ClockInInput!) {\n  clockIn(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query VehiclesQuery {\n  vehicles {\n    id\n    globalId\n    make\n    model\n    licensePlate\n    yearOfManufacture\n    displayName\n    latestOdometer\n    latestRange\n    telematicsSource\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query VehiclesQuery {\n  vehicles {\n    id\n    globalId\n    make\n    model\n    licensePlate\n    yearOfManufacture\n    displayName\n    latestOdometer\n    latestRange\n    telematicsSource\n    createdAt\n    updatedAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ClockOutMutation($input: ClockOutInput!) {\n  clockOut(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}"): (typeof documents)["mutation ClockOutMutation($input: ClockOutInput!) {\n  clockOut(input: $input) {\n    shiftEvent {\n      id\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      shiftAssignment {\n        id\n        status\n        driver {\n          id\n          fullName\n        }\n        vehicle {\n          id\n          licensePlate\n          model\n        }\n      }\n    }\n    errors {\n      message\n      field\n      code\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query CurrentShiftQuery {\n  currentShift {\n    ...CurrentShiftFragment\n  }\n}\n\nfragment CurrentShiftFragment on ShiftAssignment {\n  id\n  status\n  city\n  startTime\n  endTime\n  driver {\n    id\n    fullName\n    email\n  }\n  vehicle {\n    id\n    licensePlate\n    model\n    yearOfManufacture\n    latestOdometer\n    latestRange\n  }\n  shiftEvents {\n    id\n    eventType\n    odometer\n    vehicleRange\n    gpsLat\n    gpsLon\n    notes\n    createdAt\n  }\n}"): (typeof documents)["query CurrentShiftQuery {\n  currentShift {\n    ...CurrentShiftFragment\n  }\n}\n\nfragment CurrentShiftFragment on ShiftAssignment {\n  id\n  status\n  city\n  startTime\n  endTime\n  driver {\n    id\n    fullName\n    email\n  }\n  vehicle {\n    id\n    licensePlate\n    model\n    yearOfManufacture\n    latestOdometer\n    latestRange\n  }\n  shiftEvents {\n    id\n    eventType\n    odometer\n    vehicleRange\n    gpsLat\n    gpsLon\n    notes\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateSessionMutation($input: CreateSessionInput!) {\n  createSession(input: $input) {\n    user {\n      id\n      email\n      firstName\n      lastName\n      fullName\n      driver {\n        id\n        fullName\n      }\n    }\n    authToken {\n      accessToken\n      refreshToken\n      tokenType\n      expiresIn\n    }\n    errors {\n      message\n      code\n      field\n    }\n  }\n}"): (typeof documents)["mutation CreateSessionMutation($input: CreateSessionInput!) {\n  createSession(input: $input) {\n    user {\n      id\n      email\n      firstName\n      lastName\n      fullName\n      driver {\n        id\n        fullName\n      }\n    }\n    authToken {\n      accessToken\n      refreshToken\n      tokenType\n      expiresIn\n    }\n    errors {\n      message\n      code\n      field\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query TodayShiftsQuery {\n  todayShifts {\n    id\n    globalId\n    city\n    startTime\n    actualStartTime\n    endTime\n    actualEndTime\n    status\n    recurrenceRule\n    driver {\n      id\n      globalId\n      fullName\n      email\n      phoneNumber\n      createdAt\n    }\n    vehicle {\n      id\n      globalId\n      licensePlate\n      model\n      make\n      yearOfManufacture\n      latestOdometer\n      displayName\n      latestRange\n      telematicsSource\n    }\n    shiftEvents {\n      id\n      globalId\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      createdAt\n    }\n    revenueRecords {\n      id\n      globalId\n      totalRevenue\n      totalProfit\n      reconciled\n      createdAt\n    }\n    createdAt\n    updatedAt\n  }\n}"): (typeof documents)["query TodayShiftsQuery {\n  todayShifts {\n    id\n    globalId\n    city\n    startTime\n    actualStartTime\n    endTime\n    actualEndTime\n    status\n    recurrenceRule\n    driver {\n      id\n      globalId\n      fullName\n      email\n      phoneNumber\n      createdAt\n    }\n    vehicle {\n      id\n      globalId\n      licensePlate\n      model\n      make\n      yearOfManufacture\n      latestOdometer\n      displayName\n      latestRange\n      telematicsSource\n    }\n    shiftEvents {\n      id\n      globalId\n      eventType\n      odometer\n      vehicleRange\n      gpsLat\n      gpsLon\n      notes\n      createdAt\n    }\n    revenueRecords {\n      id\n      globalId\n      totalRevenue\n      totalProfit\n      reconciled\n      createdAt\n    }\n    createdAt\n    updatedAt\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;