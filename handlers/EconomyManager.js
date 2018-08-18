/**
 * @typedef {import("../main.js")} Client
*/


class EconomyManager {
    /**
     * Provides methods related to the economy, such as crediting, debiting or transferring coins
     * @param {Client} client - The client instance
     * @prop {array<object>} marketItems The market items
     * @prop {array<object>} slotsEvents An array of slots events
     */
    constructor(client) {
        this.client = client;
        this.marketItems = require('../structures/HandlersStructures/marketItems');
        this.slotsEvents = require('../structures/HandlersStructures/slotsEvents')(client, this);
        this.dailyEvents = require('../structures/HandlersStructures/dailyEvents')(client, this);
    }

    /**
     * Transfer coins from one account to another, taking into account the coins limit, so the coins that can't be given because the receiver has hit the limit will be given back
     * @param {object} params An object of parameters
     * @param {object} params.from Who is transferring their coins, aka who will be debited (this has to be the database entry)
     * @param {object} params.to Who is receiving the coins, aka who will be credited (this has to be the database entry)
     * @param {number} params.amount The amount of coins to transfer
     * @returns {Promise<Object>} A summary of the transaction 
     */
    async transfer(params) {
        const transactionSummary = {
            donor: {
                user: params.from.id,
                debited: (params.to.economy.coins + params.amount) > this.client.config.options.coinsLimit ? params.amount - ((params.to.economy.coins + params.amount) - this.client.config.options.coinsLimit) : params.amount
            },
            receiver: {
                user: params.to.id,
                credited: (params.to.economy.coins + params.amount) > this.client.config.options.coinsLimit ? params.amount - ((params.to.economy.coins + params.amount) - this.client.config.options.coinsLimit) : params.amount
            }
        };
        params.from.economy.coins = params.from.economy.coins - transactionSummary.donor.debited;
        params.to.economy.coins = params.to.economy.coins + transactionSummary.receiver.credited;
        const registeredTransaction = this._registerTransaction(transactionSummary, params.from, params.to);
        await Promise.all([this.client.handlers.DatabaseWrapper.set(registeredTransaction.donor, 'user'), this.client.handlers.DatabaseWrapper.set(registeredTransaction.receiver, 'user')]);
        return transactionSummary;
    }

    /**
     * 
     * @param {object} transactionSummary The summary of the transaction
     * @param {object} donor The donor
     * @param {object} receiver The receiver
     * @returns {{donor, receiver}} Returns the donor and the receiver entries with the transaction registered
     * @private 
     */
    _registerTransaction(transactionSummary, donor, receiver) {
        donor.economy.transactions.unshift(this.client.structures.References.transactionData({
            amount: -transactionSummary.donor.debited,
            from: transactionSummary.donor.user,
            to: transactionSummary.receiver.user,
            reason: 'transfer'
        }));
        donor.economy.transactions = donor.economy.transactions.slice(0, 10);
        receiver.economy.transactions.unshift(this.client.structures.References.transactionData({
            amount: transactionSummary.receiver.credited,
            from: transactionSummary.donor.user,
            to: transactionSummary.receiver.user,
            reason: 'transfer'
        }));
        receiver.economy.transactions = receiver.economy.transactions.slice(0, 10);
        return {
            donor: donor,
            receiver: receiver
        };
    }

    /**
     * Get a market item by its ID
     * @param {number} itemID - The ID of the item
     * @returns {object} The item
     */
    getItem(itemID) {
        return this.marketItems.find(i => i.id === itemID);
    }
}

module.exports = EconomyManager;