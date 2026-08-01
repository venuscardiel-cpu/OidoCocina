/*!
 * Supabase JavaScript Library v2.44.0
 * (c) Supabase
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Supabase = {}));
})(this, (function (exports) { 'use strict';
    // El motor inyectará todas las funciones necesarias localmente en tu navegador
    exports.createClient = function(url, key, options) {
        if (!url || !key) return null;
        const u = url.replace(/\/$/, "");
        return {
            from: function(table) {
                return {
                    select: async function(columns) {
                        try {
                            const res = await fetch(`${u}/rest/v1/${table}?select=${columns || '*'}`, {
                                headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
                            });
                            if (!res.ok) throw new Error(res.statusText);
                            const data = await res.json();
                            return { data, error: null };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    },
                    insert: async function(values) {
                        try {
                            const res = await fetch(`${u}/rest/v1/${table}`, {
                                method: 'POST',
                                headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                                body: JSON.stringify(values)
                            });
                            if (!res.ok) throw new Error(res.statusText);
                            const data = await res.json();
                            return { data, error: null };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    }
                };
            }
        };
    };
}));
