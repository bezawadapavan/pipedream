/* eslint-disable @typescript-eslint/ban-types */
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

type SendPayload = any
interface SendConfigHTTPKv {
  [key: string]: string
}
interface SendConfigHTTPAuth {
  username: string
  password: string
}
type UppercaseHTTPMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH"
interface SendConfigHTTP {
  method?: UppercaseHTTPMethod
  url: string
  headers?: SendConfigHTTPKv
  params?: SendConfigHTTPKv
  auth?: SendConfigHTTPAuth
  data?: SendPayload
}
interface SendConfigS3 {
  bucket: string
  prefix: string
  payload: SendPayload
}
interface SendConfigEmail {
  subject: string
  text?: string
  html?: string
}
interface SendConfigEmit {
  raw_event: SendPayload
}
interface SendConfigSSE {
  channel: string
  payload: SendPayload
}
interface SendFunctionsWrapper {
  http: (config: SendConfigHTTP) => void
  email: (config: SendConfigEmail) => void
  emit: (config: SendConfigEmit) => void
  s3: (config: SendConfigS3) => void
  sse: (config: SendConfigSSE) => void
}

/**
 * Http Response.
 */
interface HTTPResponse {
  /**
   * HTTP Status
   */
  status: number
  /**
   * Http Body
   */
  body: string | Buffer | ReadableStream
  /**
   * If true, issue the response when the promise returned is resolved, otherwise issue
   * the response at the end of the workflow execution
   */
  immediate?: boolean
}

type Methods = { [key: string]: Function }

interface FlowFunctions {
  exit: (reason: string) => void
}

interface Pipedream {
  export: (key: string, value: JSONValue) => void
  send: SendFunctionsWrapper
  /**
   * Respond to an HTTP interface.
   * @param response Define the status and body of the request.
   * @returns A promise that is fulfilled when the body is read or an immediate response is issued
   */
  respond: (response: HTTPResponse) => Promise<any> | void
  flow: FlowFunctions
}

// https://pipedream.com/docs/components/api/#props
type UserPropType = "boolean" | "boolean[]" | "integer" | "integer[]" | "string" | "string[]" | "object" | "any"
// https://pipedream.com/docs/components/api/#interface-props
type InterfacePropType = "$.interface.http" | "$.interface.timer"
// https://pipedream.com/docs/components/api/#db
type ServiceDBPropType = "$.service.db"
// https://pipedream.com/docs/code/nodejs/using-data-stores/#using-the-data-store
type DataStorePropType = "data_store"

// https://pipedream.com/docs/components/api/#async-options-example
type OptionsMethodArgs = {
  page: number
  prevContext: string
}

// https://pipedream.com/docs/components/api/#prop-definitions-example
interface PropDefinitionReference {
  propDefinition: [App<AppPropDefinitions, Methods, AuthKeys>, string]
}

// The whole implementation of this.$auth helpers is not ideal, but
// this lets a user provide keys to the $auth object in the app configuration,
// and those keys get exposed in `this.$auth` in Intellisense / typing.
type AuthKeys = {
  [key: string]: string
}
type DollarAuth<AuthKeys> = {
  $auth: Record<keyof AuthKeys, string>
}

// https://pipedream.com/docs/components/api/#app-props
// See https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype
// for more information on this technique
interface App<AppPropDefinitions, Methods, AuthKeys> {
  type: "app"
  app: string
  propDefinitions?: AppPropDefinitions | undefined
  methods?: (Methods | undefined) & ThisType<AppPropDefinitions & Methods & DollarAuth<AuthKeys>>
  $auth?: AuthKeys
}

export function defineApp<AppPropDefinitions, Methods, AuthKeys> (app: App<AppPropDefinitions, Methods, AuthKeys>): App<AppPropDefinitions, Methods, AuthKeys> {
  return {
    ...app,
  };
}

// Props

interface DefaultConfig {
  intervalSeconds?: number
  cron?: string
}

interface BasePropInterface {
  label?: string
  description?: string
}

type PropOptions = string[] | { [key: string]: string }[]

// https://pipedream.com/docs/components/api/#user-input-props
export interface UserProp extends BasePropInterface {
  type: UserPropType
  options: PropOptions | ((opts: OptionsMethodArgs) => Promise<PropOptions>)
  optional: boolean
  default: string
  secret: boolean
  min: number
  max: number
}

export interface InterfaceProp extends BasePropInterface {
  type: InterfacePropType
  default: string | DefaultConfig
}

export interface ServiceDBProp extends BasePropInterface {
  type: ServiceDBPropType
}

export interface DataStoreProp extends BasePropInterface {
  type: DataStorePropType
}

interface SourcePropDefinitions {
  [name: string]: PropDefinitionReference |
    App<AppPropDefinitions, Methods, AuthKeys> | UserProp | InterfaceProp | ServiceDBProp
}

/* interface ActionPropDefinitions {
  [name: string]: PropDefinitionReference | App<AppPropDefinitions, Methods, AuthKeys> | UserProp | DataStoreProp
}

interface ComponentPropDefinitions {
  [name: string]: PropDefinitionReference | App<AppPropDefinitions, Methods, AuthKeys> | UserProp | InterfaceProp | ServiceDBProp | DataStoreProp
} */

interface AppPropDefinitions {
  [name: string]: PropDefinitionReference | App<AppPropDefinitions, Methods, AuthKeys> | UserProp
}

interface Hooks {
  deploy?: () => Promise<void>
  activate?: () => Promise<void>
  deactivate?: () => Promise<void>
}

interface SourceRunOptions {
  event: JSONValue
}

interface ActionRunOptions {
  $: Pipedream
}

// https://pipedream.com/docs/components/api/#run
interface EmitMetadata {
  id?: string | number
  name?: string
  summary?: string
  ts: number
}
export interface EmitConfig {
  event: JSONValue
  metadata?: EmitMetadata
}

type EmitFunction = {
  $emit: (config: EmitConfig) => Promise<void>
}

// When we access props, we need to access them by key and assign the type
// designated by their `type` string. This requires a bit of logic.
type PropKeys<PropDefinitions> = Record<keyof PropDefinitions, string>

export interface Source<SourcePropDefinitions, Methods> {
  key?: string
  name?: string
  description?: string
  version?: string
  type: "source"
  methods?: Methods & ThisType<PropKeys<SourcePropDefinitions> & Methods>
  hooks?: Hooks & ThisType<PropKeys<SourcePropDefinitions> & Methods & EmitFunction>
  props: SourcePropDefinitions
  dedupe?: "last" | "greatest" | "unique"
  additionalProps?: (
    previousPropDefs: SourcePropDefinitions
  ) => Promise<SourcePropDefinitions>
  run: (this: PropKeys<SourcePropDefinitions> & Methods & EmitFunction, options?: SourceRunOptions) => Promise<void>
}

export function defineSource<SourcePropDefinitions, Methods> (source: Source<SourcePropDefinitions, Methods>): Source<SourcePropDefinitions, Methods> {
  return {
    ...source,
  };
}

export interface Action<ActionPropDefinitions, Methods> {
  key?: string
  name?: string
  description?: string
  version?: string
  type: "action"
  methods?: Methods & ThisType<PropKeys<ActionPropDefinitions> & Methods>
  props: ActionPropDefinitions & ThisType<PropKeys<ActionPropDefinitions> & Methods>
  additionalProps?: (
    previousPropDefs: ActionPropDefinitions
  ) => Promise<ActionPropDefinitions>
  run: (options?: ActionRunOptions) => Promise<void> & ThisType<PropKeys<ActionPropDefinitions> & Methods>
}

export function defineAction<ActionPropDefinitions, Methods> (action: Action<ActionPropDefinitions, Methods>): Action<ActionPropDefinitions, Methods> {
  return {
    ...action,
  };
}

// Custom errors

// HTTPErrors are used to throw status-code specific errors
// in components that make HTTP requests
export class HTTPError extends Error {
  statusCode: number
  name: string
  message: string

  constructor(code: number, name: string, message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = `HTTP${code}Error`;
    this.message = `(${name}) ${message}`;
    this.statusCode = code;
  }
}
