import { PopulateOptions, Schema } from "mongoose";

declare module 'mongoose' {
    interface Query<ResultType, DocType extends Document, THelpers = {}> {
        /**
         * `Tenant Plugin`: Find a document by tenant ID. Skip if it's empty and not use strict
         * @param tenantID Tenant ID which use to query. It can be chain with other queries.
         * @param isStrict if true, if tenantID is empty will make query document that not exist tenant
         */
        byTenant(tenantID?: string, checkrole?: boolean): this;
        /**
         * `Tenant Plugin`
         * Specifies tenant should be populated with other documents in the case tenantID is ObjectID
         * @param select Field selection for the population query
         * @param model The model you wish to use for population. If not specified, populate
         * will take the default model name (`Organization`).
         * @param options Populate option to make nest population
         */
        populateTenant(select?: string, model?: string, options?: PopulateOptions): this;

    }

    interface Document<T = any, TQueryHelpers = any> {
        /**
         * `Tenant Plugin`
         * Register the document with tenantID
         * @param id ID of tenant. It can be an ObjectID if tenant ref to other collection. Or just an unique ID
         */
        withTenant(id?: string): this;
        /**
         * `Tenant Plugin`
         * Populate tenant id if possible
         */
        populateTenant(select?: string, model?: string, options?: PopulateOptions): this;
    }
}

export class TenantPlugin {
    private static readonly k_tenant_field = 'owner';
    private static readonly k_ref_model = 'User';

    public static addPlugin(schema: Schema) {
        const subSchema = {};
        subSchema[TenantPlugin.k_tenant_field] = Schema.Types.ObjectId;
        schema.add(subSchema);

        schema.methods.withTenant = function (tenantID: string) {
            // may be we pass tenantID as ObjectID
            if (tenantID && tenantID.toString().length > 0)
                this[TenantPlugin.k_tenant_field] = tenantID;
            return this;
        }

        schema.methods.populateTenant = function (select?: string, model?: string,
            options?: PopulateOptions) {
            if (!options) {
                return this.populate({
                    path: TenantPlugin.k_tenant_field,
                    select: select,
                    model: model || TenantPlugin.k_ref_model
                });
            } else {
                return this.populate({
                    path: TenantPlugin.k_tenant_field,
                    select: select,
                    model: model || TenantPlugin.k_ref_model,
                    populate: options
                });
            }
        }

        schema.query.populateTenant = function (select?: string, model?: string,
            options?: PopulateOptions) {
            if (!options) {
                return this.populate(TenantPlugin.k_tenant_field, select,
                    model || TenantPlugin.k_ref_model);
            } else {
                return this.populate({
                    path: TenantPlugin.k_tenant_field,
                    select: select,
                    model: model || TenantPlugin.k_ref_model,
                    populate: options
                });
            }
        }

        schema.query.byTenant = function (tenantID?: string, isRole?: boolean, isStrict?: boolean) {
            if (!tenantID && !isRole) {
                if (isStrict && !this.getQuery()[TenantPlugin.k_tenant_field]) {
                    return this.exists(TenantPlugin.k_tenant_field, false);
                } else {
                    return this;
                }
            }
            if(isRole){
                return this;
            }else{
                return this.where(TenantPlugin.k_tenant_field).equals(tenantID);
            }
            
        }
    }
}