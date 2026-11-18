/** A focused iOS TextInput refuses to give up the touch responder by default (rejectResponderTermination), so a tap on a button next to it can start without ever firing onPressIn. Spread this on every TextInput. */
export const inputResponder = { rejectResponderTermination: false } as const
