// map widget
class Maps extends Widget {
    constructor(id, widget) {
        super(id, widget)
        // variables
        this.map = null
        // add an empty box into the given column
        this.template.add_large_widget(this.id, this.widget["title"])
    }
    
    // request the data to the database
    request_data() {
        // customize the chart based on the selected timeframe
        var timeframe = "last_4_hours"
        this.widget["group_by"]="day"
        if ("group_by" in this.widget) {
            if (this.widget["group_by"] == "hour") timeframe = "last_24_hours"
            else if (this.widget["group_by"] == "day") timeframe = "last_365_days"
        }
        // for each sensor
        for (var i = 0; i < this.widget["sensors"].length; i++) {
            var sensor_id = this.widget["sensors"][i]
            this.add_configuration_listener("sensors/"+sensor_id)
            var message = new Message(gui)
            message.recipient = "controller/db"
            message.command = "GET"
            message.set("timeframe", timeframe)
            // request calculated average values if group_by specified
            message.args = "group_by" in this.widget ? sensor_id+"/"+this.widget["group_by"]+"/"+"avg" : sensor_id
            gui.sessions.register(message, {
                "sensor_id": sensor_id,
            })
            this.send(message)
        }
    }
    
    // draw the widget's content
    draw() {
        // IDs Template: _box, _title, _refresh, _popup, _body, _loading
        // IDs Widget: _map
        // add the map
        var body = "#"+this.id+"_body"
        $(body).html('<div id="'+this.id+'_map" style="width:100%; height: 640px;"></div>')
        // load google maps api (lazy loading since we need the api_key from the conf)
        var script = document.createElement('script')
        script.src = "https://maps.googleapis.com/maps/api/js?key="+gui.settings["map"]["api_key"]
        script.onload = function(this_class) {
            return function () {
                var script = document.createElement('script');
                script.src = "lib/gmaps/gmaps.min.js";
                // load gmaps 
                script.onload = function(this_class) {
                    return function () {
                        //create the map
                        this_class.map = new GMaps({
                            div: "#"+this_class.id+"_map",
                            lat: 0,
                            lng: 0,
                            mapType: gui.settings["map"]["type"],
                            zoom: 2
                        });
                        // request the data
                        this_class.request_data()
                    }; // end function ()
                }(this_class); // onload gmaps.js
                // append gmaps to head
                document.head.appendChild(script);
            }; // end function ()
        }(this); // onload google maps
        // append google api to head
        document.head.appendChild(script);
        
    }
    
    // close the widget
    close() {
    }
    
    // receive data and load it into the widget
    on_message(message) {
        // database just saved a value check if our sensor is involved and if so refresh the data
        if (message.sender == "controller/db" && message.command == "SAVED") {
            for (var sensor of this.widget["sensors"]) {
                if (message.args == sensor) {
                    // TODO: clear the map
                    // request the updated data
                    this.request_data()
                    return
                }
            }
        }
        else if (message.sender == "controller/db" && message.command.startsWith("GET")) {
            var session = gui.sessions.restore(message)
            if (session == null) return
            var data = message.get("data")
            gui.log_debug("received "+data)
            if (data.length == 0) return
            var waypoints = []
            // for each data point
            for (var i = 0; i < data.length; i++) {
                if (data[i][1] == null) continue
                // normalize and parse position
                data[i][1] = data[i][1].replaceAll("u'", "'").replaceAll("'", "\"")
                var position = JSON.parse(data[i][1])
                // add a marker
                var options = {
                    lat: position["latitude"],
                    lng: position["longitude"],
                    label: position["label"],
                    icon: null,
                    infoWindow: { content: position["text"]}
                }
                // customize the layout of the marker when tracking position
                if ("tracking" in this.widget && this.widget["tracking"]) {
                    if (i == (data.length-1)) {
                        // this is the last position, if the position is not accurate, draw a circle around it
                        if ("accuracy" in position && position["accuracy"] > 500) {
                            this.map.drawCircle({
                                lat: position["latitude"],
                                lng: position["longitude"],
                                radius: position["accuracy"],
                                strokeColor: '#BBD8E9',
                                strokeOpacity: 1,
                                strokeWeight: 3,
                                fillColor: '#BBD8E9',
                                fillOpacity: 0.6
                            });
                        }
                    } else {
                        // for intermediate positions, remote the label and use a small blue dot as icon
                        options["label"] = null;
                        options["icon"] = "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png";
                    }
                }
                // add the marker to the map
                this.map.addMarker(options)
                // keep track of the waypoint
                waypoints.push({location:position["latitude"]+","+position["longitude"],stopover: true})
                // auto zoom the map
                this.map.fitZoom();
                if ("tracking" in this.widget && this.widget["tracking"]) {
                    // build the route
                    if (waypoints.length < 2) return;
                    // set origin and destination
                    var first = JSON.parse(data[0][1])
                    var last = JSON.parse(data[(data.length-1)][1])
                    // draw the route
                    thismap.drawRoute({
                        origin: [first["latitude"],first["longitude"]],
                        destination: [last["latitude"],last["longitude"]],
                        travelMode: 'driving',
                        strokeColor: get_color(),
                        strokeOpacity: 0.6,
                        strokeWeight: 6,
                        waypoints: waypoints
                    });                    
                    // auto zoom the map
                    this.map.fitZoom();
                }
            }
        }

    }
    
    // receive configuration
    on_configuration(message) {
    }
}