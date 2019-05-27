"use strict"

var app = new Vue({
    el: '#app',
    data: {
        contributors: [
            { id: 1, name: "MerlinBuczek" },
            { id: 2, name: "Pauldb8" }
        ]
    },
    computed: {
        channel() { return window.location.hash }
    },
    components: {
        'channelinput': {
            template: `
                <input
                    :class="getClass()"
                    step=2
                    placeholder="Choose a channel"
                    @input="addHashtag()"
                    @keyup.enter="setChannel()"
                    v-model="channel">`,
            data() {
                return {
                    channel: window.location.hash
                }
            },
            methods: {
                getClass() {
                    return {
                        centered: true,
                        primaryInput: true
                    }
                },
                addHashtag() {
                    if (!this.channel.startsWith('#')) {
                        this.channel = '#' + this.channel
                    }
                },
                setChannel() {
                    window.location.href = this.channel
                }
            }
        },
        'contact': {
            props: [
                'name'
            ],
            computed: {
                handle() { return '@' + this.name },
                link() { return 'https://twitter.com/' + this.name }
            },
            template: `
                <li>
                    <a :href="link">{{ handle }}</a>
                </li>`,
        }
    }
})