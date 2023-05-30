
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const expansionState = writable({});

    /* src/TreeView.svelte generated by Svelte v3.59.1 */
    const file$2 = "src/TreeView.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (39:4) {:else}
    function create_else_block(ctx) {
    	let span1;
    	let span0;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			t0 = space();
    			t1 = text(/*label*/ ctx[3]);
    			attr_dev(span0, "class", "no-arrow svelte-z8cswz");
    			add_location(span0, file$2, 40, 8, 1202);
    			attr_dev(span1, "title", `File : ${/*label*/ ctx[3]}`);
    			add_location(span1, file$2, 39, 6, 1160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t0);
    			append_dev(span1, t1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if children}
    function create_if_block$1(ctx) {
    	let span2;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let span1_class_value;
    	let t3;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*expanded*/ ctx[1] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			span2 = element("span");
    			span0 = element("span");
    			span0.textContent = "▶";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*label*/ ctx[3]);
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "class", "arrow svelte-z8cswz");
    			toggle_class(span0, "arrowDown", /*arrowDown*/ ctx[2]);
    			add_location(span0, file$2, 27, 8, 776);

    			attr_dev(span1, "class", span1_class_value = "" + (null_to_empty(`${/*selectedLbl*/ ctx[0] === /*label*/ ctx[3]
			? "selected"
			: ""}`) + " svelte-z8cswz"));

    			add_location(span1, file$2, 28, 8, 836);
    			attr_dev(span2, "title", `Folder : ${/*label*/ ctx[3]}`);
    			add_location(span2, file$2, 26, 6, 705);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span2, anchor);
    			append_dev(span2, span0);
    			append_dev(span2, t1);
    			append_dev(span2, span1);
    			append_dev(span1, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span1, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(span2, "click", /*toggleExpansion*/ ctx[5], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*arrowDown*/ 4) {
    				toggle_class(span0, "arrowDown", /*arrowDown*/ ctx[2]);
    			}

    			if (!current || dirty & /*selectedLbl*/ 1 && span1_class_value !== (span1_class_value = "" + (null_to_empty(`${/*selectedLbl*/ ctx[0] === /*label*/ ctx[3]
			? "selected"
			: ""}`) + " svelte-z8cswz"))) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (/*expanded*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*expanded*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(25:4) {#if children}",
    		ctx
    	});

    	return block;
    }

    // (34:6) {#if expanded}
    function create_if_block_1$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*children*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children, selectedLbl*/ 17) {
    				each_value = /*children*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(34:6) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    // (35:8) {#each children as child}
    function create_each_block(ctx) {
    	let treeview;
    	let updating_selectedLbl;
    	let current;

    	function treeview_selectedLbl_binding(value) {
    		/*treeview_selectedLbl_binding*/ ctx[9](value);
    	}

    	let treeview_props = { tree: /*child*/ ctx[10] };

    	if (/*selectedLbl*/ ctx[0] !== void 0) {
    		treeview_props.selectedLbl = /*selectedLbl*/ ctx[0];
    	}

    	treeview = new TreeView({ props: treeview_props, $$inline: true });
    	binding_callbacks.push(() => bind(treeview, 'selectedLbl', treeview_selectedLbl_binding));

    	const block = {
    		c: function create() {
    			create_component(treeview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(treeview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const treeview_changes = {};

    			if (!updating_selectedLbl && dirty & /*selectedLbl*/ 1) {
    				updating_selectedLbl = true;
    				treeview_changes.selectedLbl = /*selectedLbl*/ ctx[0];
    				add_flush_callback(() => updating_selectedLbl = false);
    			}

    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(treeview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:8) {#each children as child}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let ul;
    	let li;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*children*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			if_block.c();
    			add_location(li, file$2, 23, 2, 609);
    			attr_dev(ul, "class", "svelte-z8cswz");
    			add_location(ul, file$2, 21, 0, 572);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			if_blocks[current_block_type_index].m(li, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let expanded;
    	let arrowDown;
    	let $expansionState;
    	validate_store(expansionState, 'expansionState');
    	component_subscribe($$self, expansionState, $$value => $$invalidate(7, $expansionState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TreeView', slots, []);
    	let { tree, selectedLbl } = $$props;
    	const { label, children } = tree;

    	/* Function to Toggle Folder Expansion state */
    	const toggleExpansion = () => {
    		let value = !expanded;
    		$$invalidate(1, expanded = value);

    		expansionState.update(state => {
    			const updatedState = { ...state };
    			updatedState[label] = value;
    			return updatedState;
    		});
    	};

    	$$self.$$.on_mount.push(function () {
    		if (tree === undefined && !('tree' in $$props || $$self.$$.bound[$$self.$$.props['tree']])) {
    			console.warn("<TreeView> was created without expected prop 'tree'");
    		}

    		if (selectedLbl === undefined && !('selectedLbl' in $$props || $$self.$$.bound[$$self.$$.props['selectedLbl']])) {
    			console.warn("<TreeView> was created without expected prop 'selectedLbl'");
    		}
    	});

    	const writable_props = ['tree', 'selectedLbl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TreeView> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, selectedLbl = label);

    	function treeview_selectedLbl_binding(value) {
    		selectedLbl = value;
    		$$invalidate(0, selectedLbl);
    	}

    	$$self.$$set = $$props => {
    		if ('tree' in $$props) $$invalidate(6, tree = $$props.tree);
    		if ('selectedLbl' in $$props) $$invalidate(0, selectedLbl = $$props.selectedLbl);
    	};

    	$$self.$capture_state = () => ({
    		expansionState,
    		tree,
    		selectedLbl,
    		label,
    		children,
    		toggleExpansion,
    		expanded,
    		arrowDown,
    		$expansionState
    	});

    	$$self.$inject_state = $$props => {
    		if ('tree' in $$props) $$invalidate(6, tree = $$props.tree);
    		if ('selectedLbl' in $$props) $$invalidate(0, selectedLbl = $$props.selectedLbl);
    		if ('expanded' in $$props) $$invalidate(1, expanded = $$props.expanded);
    		if ('arrowDown' in $$props) $$invalidate(2, arrowDown = $$props.arrowDown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$expansionState*/ 128) {
    			$$invalidate(1, expanded = $expansionState[label] || false);
    		}

    		if ($$self.$$.dirty & /*expanded*/ 2) {
    			$$invalidate(2, arrowDown = expanded);
    		}
    	};

    	return [
    		selectedLbl,
    		expanded,
    		arrowDown,
    		label,
    		children,
    		toggleExpansion,
    		tree,
    		$expansionState,
    		click_handler,
    		treeview_selectedLbl_binding
    	];
    }

    class TreeView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { tree: 6, selectedLbl: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeView",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get tree() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tree(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedLbl() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedLbl(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Login.svelte generated by Svelte v3.59.1 */

    const file$1 = "src/Login.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let form;
    	let h5;
    	let t1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let br0;
    	let t5;
    	let br1;
    	let t6;
    	let label1;
    	let t8;
    	let input1;
    	let t9;
    	let br2;
    	let t10;
    	let br3;
    	let t11;
    	let div;
    	let button0;
    	let t13;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			form = element("form");
    			h5 = element("h5");
    			h5.textContent = "Login";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Username :";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Password  :";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			br2 = element("br");
    			t10 = space();
    			br3 = element("br");
    			t11 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Login";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			attr_dev(h5, "class", "login-heading svelte-17undty");
    			add_location(h5, file$1, 17, 4, 377);
    			attr_dev(label0, "for", "username");
    			add_location(label0, file$1, 18, 4, 419);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "username");
    			attr_dev(input0, "id", "username");
    			input0.value = /*username*/ ctx[0];
    			add_location(input0, file$1, 19, 4, 466);
    			add_location(br0, file$1, 28, 4, 646);
    			add_location(br1, file$1, 29, 4, 658);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$1, 30, 4, 670);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "id", "password");
    			input1.value = /*password*/ ctx[1];
    			add_location(input1, file$1, 31, 4, 723);
    			add_location(br2, file$1, 40, 4, 907);
    			add_location(br3, file$1, 41, 4, 919);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$1, 43, 6, 963);
    			attr_dev(button1, "type", "reset");
    			add_location(button1, file$1, 44, 6, 1030);
    			attr_dev(div, "class", "button-row svelte-17undty");
    			add_location(div, file$1, 42, 4, 931);
    			add_location(form, file$1, 16, 2, 365);
    			attr_dev(section, "class", "login-section svelte-17undty");
    			add_location(section, file$1, 15, 0, 330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, form);
    			append_dev(form, h5);
    			append_dev(form, t1);
    			append_dev(form, label0);
    			append_dev(form, t3);
    			append_dev(form, input0);
    			append_dev(form, t4);
    			append_dev(form, br0);
    			append_dev(form, t5);
    			append_dev(form, br1);
    			append_dev(form, t6);
    			append_dev(form, label1);
    			append_dev(form, t8);
    			append_dev(form, input1);
    			append_dev(form, t9);
    			append_dev(form, br2);
    			append_dev(form, t10);
    			append_dev(form, br3);
    			append_dev(form, t11);
    			append_dev(form, div);
    			append_dev(div, button0);
    			append_dev(div, t13);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[4], false, false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[5], false, false, false, false),
    					listen_dev(button0, "click", /*handleLogin*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				prop_dev(input0, "value", /*username*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				prop_dev(input1, "value", /*password*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let { isLoggedIn = false } = $$props;
    	let username = "", password = "";

    	const handleLogin = () => {
    		if (username.trim() === "guest" || password.trim() === "guest") {
    			$$invalidate(3, isLoggedIn = true);
    		} else {
    			$$invalidate(3, isLoggedIn = false);
    			alert("Invalid username or password.");
    		}
    	};

    	const writable_props = ['isLoggedIn'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => {
    		$$invalidate(0, username = e.target.value);
    	};

    	const change_handler_1 = e => {
    		$$invalidate(1, password = e.target.value);
    	};

    	$$self.$$set = $$props => {
    		if ('isLoggedIn' in $$props) $$invalidate(3, isLoggedIn = $$props.isLoggedIn);
    	};

    	$$self.$capture_state = () => ({
    		isLoggedIn,
    		username,
    		password,
    		handleLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ('isLoggedIn' in $$props) $$invalidate(3, isLoggedIn = $$props.isLoggedIn);
    		if ('username' in $$props) $$invalidate(0, username = $$props.username);
    		if ('password' in $$props) $$invalidate(1, password = $$props.password);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [username, password, handleLogin, isLoggedIn, change_handler, change_handler_1];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { isLoggedIn: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get isLoggedIn() {
    		throw new Error("<Login>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLoggedIn(value) {
    		throw new Error("<Login>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.1 */
    const file = "src/App.svelte";

    // (99:2) {#if !isLoggedIn}
    function create_if_block_3(ctx) {
    	let login;
    	let updating_isLoggedIn;
    	let current;

    	function login_isLoggedIn_binding(value) {
    		/*login_isLoggedIn_binding*/ ctx[7](value);
    	}

    	let login_props = {};

    	if (/*isLoggedIn*/ ctx[1] !== void 0) {
    		login_props.isLoggedIn = /*isLoggedIn*/ ctx[1];
    	}

    	login = new Login({ props: login_props, $$inline: true });
    	binding_callbacks.push(() => bind(login, 'isLoggedIn', login_isLoggedIn_binding));

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const login_changes = {};

    			if (!updating_isLoggedIn && dirty & /*isLoggedIn*/ 2) {
    				updating_isLoggedIn = true;
    				login_changes.isLoggedIn = /*isLoggedIn*/ ctx[1];
    				add_flush_callback(() => updating_isLoggedIn = false);
    			}

    			login.$set(login_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(99:2) {#if !isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    // (102:2) {#if isLoggedIn}
    function create_if_block(ctx) {
    	let header;
    	let button0;
    	let t1;
    	let section0;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let select;
    	let option0;
    	let option1;
    	let t7;
    	let button1;
    	let t8;
    	let button1_disabled_value;
    	let t9;
    	let button2;
    	let t11;
    	let t12;
    	let t13;
    	let section1;
    	let hr;
    	let t14;
    	let p;
    	let t16;
    	let treeview;
    	let updating_tree;
    	let updating_selectedLbl;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*selectedLabel*/ ctx[0] === "" && create_if_block_2(ctx);
    	let if_block1 = /*selectedLabel*/ ctx[0] !== "" && create_if_block_1(ctx);

    	function treeview_tree_binding(value) {
    		/*treeview_tree_binding*/ ctx[11](value);
    	}

    	function treeview_selectedLbl_binding(value) {
    		/*treeview_selectedLbl_binding*/ ctx[12](value);
    	}

    	let treeview_props = {};

    	if (/*tree*/ ctx[2] !== void 0) {
    		treeview_props.tree = /*tree*/ ctx[2];
    	}

    	if (/*selectedLabel*/ ctx[0] !== void 0) {
    		treeview_props.selectedLbl = /*selectedLabel*/ ctx[0];
    	}

    	treeview = new TreeView({ props: treeview_props, $$inline: true });
    	binding_callbacks.push(() => bind(treeview, 'tree', treeview_tree_binding));
    	binding_callbacks.push(() => bind(treeview, 'selectedLbl', treeview_selectedLbl_binding));

    	const block = {
    		c: function create() {
    			header = element("header");
    			button0 = element("button");
    			button0.textContent = "Logout";
    			t1 = space();
    			section0 = element("section");
    			label = element("label");
    			label.textContent = "Name :";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "File";
    			option1 = element("option");
    			option1.textContent = "Folder";
    			t7 = space();
    			button1 = element("button");
    			t8 = text("Save");
    			t9 = space();
    			button2 = element("button");
    			button2.textContent = "Cancel";
    			t11 = space();
    			if (if_block0) if_block0.c();
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			section1 = element("section");
    			hr = element("hr");
    			t14 = space();
    			p = element("p");
    			p.textContent = "Directory Structure :";
    			t16 = space();
    			create_component(treeview.$$.fragment);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file, 103, 6, 2923);
    			attr_dev(header, "class", "app-header svelte-1w0z1y5");
    			add_location(header, file, 102, 4, 2889);
    			attr_dev(label, "for", "name");
    			add_location(label, file, 111, 6, 3099);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "name");
    			attr_dev(input, "id", "name");
    			add_location(input, file, 112, 6, 3139);
    			option0.__value = "File";
    			option0.value = option0.__value;
    			add_location(option0, file, 119, 8, 3347);
    			option1.__value = "Folder";
    			option1.value = option1.__value;
    			add_location(option1, file, 120, 8, 3390);
    			attr_dev(select, "name", "dirtype");
    			attr_dev(select, "id", "dirtype");
    			add_location(select, file, 113, 6, 3207);
    			attr_dev(button1, "type", "button");
    			button1.disabled = button1_disabled_value = /*selectedLabel*/ ctx[0].trim() === "" ? true : false;
    			add_location(button1, file, 122, 6, 3451);
    			attr_dev(button2, "type", "button");
    			add_location(button2, file, 127, 6, 3608);
    			attr_dev(section0, "class", "input-section svelte-1w0z1y5");
    			add_location(section0, file, 110, 4, 3061);
    			add_location(hr, file, 149, 6, 4238);
    			attr_dev(p, "class", "directory-heading svelte-1w0z1y5");
    			add_location(p, file, 150, 6, 4251);
    			attr_dev(section1, "class", "display-section svelte-1w0z1y5");
    			add_location(section1, file, 148, 4, 4198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, button0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, label);
    			append_dev(section0, t3);
    			append_dev(section0, input);
    			set_input_value(input, /*name*/ ctx[3]);
    			append_dev(section0, t4);
    			append_dev(section0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*selectedDirType*/ ctx[4]);
    			append_dev(section0, t7);
    			append_dev(section0, button1);
    			append_dev(button1, t8);
    			append_dev(section0, t9);
    			append_dev(section0, button2);
    			append_dev(section0, t11);
    			if (if_block0) if_block0.m(section0, null);
    			append_dev(section0, t12);
    			if (if_block1) if_block1.m(section0, null);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, hr);
    			append_dev(section1, t14);
    			append_dev(section1, p);
    			append_dev(section1, t16);
    			mount_component(treeview, section1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(select, "change", /*handleDirTypeChange*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*handleSaveBtnClick*/ ctx[6], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 8 && input.value !== /*name*/ ctx[3]) {
    				set_input_value(input, /*name*/ ctx[3]);
    			}

    			if (!current || dirty & /*selectedDirType*/ 16) {
    				select_option(select, /*selectedDirType*/ ctx[4]);
    			}

    			if (!current || dirty & /*selectedLabel*/ 1 && button1_disabled_value !== (button1_disabled_value = /*selectedLabel*/ ctx[0].trim() === "" ? true : false)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (/*selectedLabel*/ ctx[0] === "") {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(section0, t12);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*selectedLabel*/ ctx[0] !== "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(section0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const treeview_changes = {};

    			if (!updating_tree && dirty & /*tree*/ 4) {
    				updating_tree = true;
    				treeview_changes.tree = /*tree*/ ctx[2];
    				add_flush_callback(() => updating_tree = false);
    			}

    			if (!updating_selectedLbl && dirty & /*selectedLabel*/ 1) {
    				updating_selectedLbl = true;
    				treeview_changes.selectedLbl = /*selectedLabel*/ ctx[0];
    				add_flush_callback(() => updating_selectedLbl = false);
    			}

    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(section1);
    			destroy_component(treeview);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(102:2) {#if isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    // (135:6) {#if selectedLabel === ""}
    function create_if_block_2(ctx) {
    	let h5;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "Instructions";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Please Click on Folder Name below to Select a Folder";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Please Click on Arrow icon to before Name to Expand or Close the\n            Folder";
    			attr_dev(h5, "class", "instruction-heading svelte-1w0z1y5");
    			add_location(h5, file, 135, 8, 3790);
    			add_location(li0, file, 137, 10, 3863);
    			add_location(li1, file, 138, 10, 3935);
    			add_location(ul, file, 136, 8, 3848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(135:6) {#if selectedLabel === \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (145:6) {#if selectedLabel !== ""}
    function create_if_block_1(ctx) {
    	let p;
    	let t0;
    	let b;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Selected Folder : ");
    			b = element("b");
    			t1 = text(/*selectedLabel*/ ctx[0]);
    			add_location(b, file, 145, 29, 4140);
    			add_location(p, file, 145, 8, 4119);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, b);
    			append_dev(b, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedLabel*/ 1) set_data_dev(t1, /*selectedLabel*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(145:6) {#if selectedLabel !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t;
    	let current;
    	let if_block0 = !/*isLoggedIn*/ ctx[1] && create_if_block_3(ctx);
    	let if_block1 = /*isLoggedIn*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file, 97, 0, 2801);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*isLoggedIn*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*isLoggedIn*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*isLoggedIn*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*isLoggedIn*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let selectedLabel = "", isLoggedIn = false;

    	let tree = {
    		label: "root",
    		children: [], // {
    		//   label: "Folder A",
    		
    	}; //   children: [
    	//     {
    	//       label: "Folder D",

    	//       children: [
    	//         { label: "File 1" },
    	//         { label: "File 2" },
    	//         { label: "File 3" },
    	//       ],
    	//     },
    	//     { label: "File 4" },
    	//   ],
    	// },
    	/* Resets all Expansion state to false, starting from root */
    	const resetAllExpansionState = () => {
    		expansionState.update(state => {
    			const updatedState = { ...state };

    			for (const k in updatedState) {
    				if (updatedState.hasOwnProperty(k)) {
    					updatedState[k] = false;
    				}
    			}

    			return updatedState;
    		});
    	};

    	let name, selectedDirType = "File";

    	/* Handler function to update Directory type dropdown */
    	const handleDirTypeChange = e => {
    		$$invalidate(4, selectedDirType = e.target.value);
    	};

    	/* Creates new File / Folder Directory */
    	const addNodeToTree = t => {
    		let treeClone = { ...t };

    		while (treeClone?.children?.length >= 0) {
    			// If root element is the selected element
    			if (treeClone.label === selectedLabel) {
    				// If Children exists with same name
    				if (treeClone?.children?.find(child => child.label === name)) {
    					alert("Object exists with same name");
    					break;
    				}

    				// If selected Directory is File
    				if (selectedDirType === "File") {
    					// new file is last children
    					treeClone.children.push({ label: name });

    					alert(`Success : File ${name} created.`);
    					$$invalidate(3, name = "");
    				}

    				// If selected Directory is Folder
    				if (selectedDirType === "Folder") {
    					// If Subfolder exists
    					if (treeClone?.children.find(child => !!child.children)) {
    						alert("Can't add more than 1 Folder in a Directory");
    						break;
    					}

    					// new folder is alwyas first children
    					treeClone.children.unshift({ label: name, children: [] });

    					alert(`Success : Folder ${name} created.`);
    					$$invalidate(3, name = "");
    				}

    				break;
    			} else // Find Child Element with same label
    			{
    				// First Child will always be Folder so check for the selected
    				// label in first child node
    				addNodeToTree(treeClone.children[0]);

    				return treeClone;
    			}
    		}

    		return treeClone;
    	};

    	/* Handler for Click on Save Button */
    	const handleSaveBtnClick = () => {
    		$$invalidate(2, tree = addNodeToTree(tree));
    		resetAllExpansionState();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function login_isLoggedIn_binding(value) {
    		isLoggedIn = value;
    		$$invalidate(1, isLoggedIn);
    	}

    	const click_handler = () => {
    		$$invalidate(1, isLoggedIn = false);
    	};

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(3, name);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(3, name = "");
    		$$invalidate(0, selectedLabel = "");
    	};

    	function treeview_tree_binding(value) {
    		tree = value;
    		$$invalidate(2, tree);
    	}

    	function treeview_selectedLbl_binding(value) {
    		selectedLabel = value;
    		$$invalidate(0, selectedLabel);
    	}

    	$$self.$capture_state = () => ({
    		TreeView,
    		Login,
    		expansionState,
    		selectedLabel,
    		isLoggedIn,
    		tree,
    		resetAllExpansionState,
    		name,
    		selectedDirType,
    		handleDirTypeChange,
    		addNodeToTree,
    		handleSaveBtnClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('selectedLabel' in $$props) $$invalidate(0, selectedLabel = $$props.selectedLabel);
    		if ('isLoggedIn' in $$props) $$invalidate(1, isLoggedIn = $$props.isLoggedIn);
    		if ('tree' in $$props) $$invalidate(2, tree = $$props.tree);
    		if ('name' in $$props) $$invalidate(3, name = $$props.name);
    		if ('selectedDirType' in $$props) $$invalidate(4, selectedDirType = $$props.selectedDirType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedLabel,
    		isLoggedIn,
    		tree,
    		name,
    		selectedDirType,
    		handleDirTypeChange,
    		handleSaveBtnClick,
    		login_isLoggedIn_binding,
    		click_handler,
    		input_input_handler,
    		click_handler_1,
    		treeview_tree_binding,
    		treeview_selectedLbl_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
