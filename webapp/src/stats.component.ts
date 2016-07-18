/* Copyright (c) 2016 Jason Ish
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import {Component} from "@angular/core";
import {ElasticSearchService} from "./elasticsearch.service";

@Component({
    template: `
<!--<div class="row">-->
  <!--<div class="col-md-12">-->
    <!--<table class="table table-striped table-condensed">-->
      <!--<thead>-->
      <!--<tr>-->
        <!--<th>Stats</th>-->
        <!--<th>Value</th>-->
      <!--</tr>-->
      <!--</thead>-->
      <!--<tbody>-->
      <!--<tr *ngFor="let item of lastStats | mapToItems">-->
        <!--<td>{{item.key}}</td>-->
        <!--<td>{{item.val}}</td>-->
      <!--</tr>-->
      <!--</tbody>-->
    <!--</table>-->
  <!--</div>-->
<!--</div>-->
`
})
export class StatsComponent {

    constructor(private elasticsearch:ElasticSearchService) {
    }

    ngOnInit() {

        // this.reports.getLastStat().then((response:any) => {
        //     let stat = response.hits.hits[0];
        //     this.lastStats = this.flattenStat(stat._source.stats);
        // });

        this.getStats();

    }

    getStats() {
        let query:any = {
            query: {
                filtered: {
                    filter: {
                        and: [
                            {exists: {field: "event_type"}},
                            {term: {event_type: "stats"}}
                        ]
                    }
                }
            },
            sort: [
                {"@timestamp": {order: "desc"}}
            ],
            aggs: {
                sensors: {
                    terms: {
                        field: "host.raw"
                    },
                    aggs: {
                        per_minute: {
                            date_histogram: {
                                field: "@timestamp",
                                interval: "minute"
                            },
                            aggs: {
                                kernel_packets: {
                                    max: {
                                        field: "stats.capture.kernel_packets"
                                    }
                                },
                                kernel_drops: {
                                    max: {
                                        field: "stats.capture.kernel_drops"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        this.elasticsearch.search(query).then((response:any) => {

            console.log(response.aggregations);

            response.aggregations.sensors.buckets.forEach((sensor:any) => {
                console.log(sensor);
            });

        });
    }

    /**
     * Example: this.flattenStat(reponse.hits.hits[0]._source.stats
     */
    flattenStat(stat:any):any {

        let flat = {};

        function _flatten(obj:any, prefix:string = ""):any {

            Object.keys(obj).map((key:any) => {
                name = prefix + "." + key;
                let type = typeof obj[key];
                if (type === 'object') {
                    return _flatten(obj[key], name);
                }
                flat[name] = obj[key];
            })

        }

        _flatten(stat, "stats");

        return flat;
    }

}