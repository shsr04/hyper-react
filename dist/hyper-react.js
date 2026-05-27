import { createElement as e, useLayoutEffect as t, useSyncExternalStore as n } from "react";
import { createRoot as r } from "react-dom/client";
//#region src/hyper-react.ts
function i({ hook: e, store: n }) {
	let r = e();
	return t(() => {
		n.mutate(r);
	}, [n, r]), null;
}
var a = class {
	hook;
	snapshot;
	isReady = !1;
	listeners = /* @__PURE__ */ new Set();
	mountPoint = null;
	constructor(e) {
		this.hook = e, this.ensureMounted();
	}
	destroy() {
		this.mountPoint?.unmount(), this.mountPoint = null, this.listeners.clear(), this.isReady = !1;
	}
	subscribe = (e) => (this.listeners.add(e), () => {
		this.listeners.delete(e);
	});
	getSnapshot = () => {
		if (!this.isReady) throw Error("HookStore is not ready: " + this.hook.name);
		return this.snapshot;
	};
	mutate(e) {
		Object.is(e, this.snapshot) || (this.snapshot = e, this.isReady = !0, this.listeners.forEach((e) => e()));
	}
	ensureMounted() {
		if (this.mountPoint != null) return;
		let t = document.createElement("div");
		this.mountPoint = r(t), this.mountPoint.render(e(i, {
			hook: this.hook,
			store: this
		}));
	}
}, o = /* @__PURE__ */ new Map();
function s(e) {
	let t = o.get(e);
	if (t == null) {
		let t = new a(e);
		return o.set(e, t), t;
	}
	return t;
}
function c() {
	for (let e of o.values()) e.destroy();
	o.clear();
}
function l(e) {
	if (!e.name.startsWith("use")) throw Error("Supplied hook must be a named function starting with `use...`. Given: " + e.name);
	let t = s(e);
	return function() {
		return n(t.subscribe, t.getSnapshot);
	};
}
//#endregion
export { l as default, c as resetInternalState };
