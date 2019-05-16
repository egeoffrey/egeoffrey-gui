

// Widget class from which all the widgets inherits common functionalities
class Widget {
    constructor(id, widget) {
        // keep track html id and widget content
        this.id = id.replaceAll("/","_")
        this.widget = widget
        this.template = new Templates()
    }
    
    // draw the widget (subclass has to implement)
    draw() {
        throw new Error('draw() not implemented')
    }
    
    // close the widget (subclass has to implement)
    close() {
        throw new Error('close() not implemented')
    }
    
    // load data into the widget (subclass has to implement)
    on_message(message) {
        throw new Error('on_message() not implemented')
    }
    
    // pass configuration into the widget (subclass has to implement)
    on_configuration(message) {
        throw new Error('on_configuration() not implemented')
    }
    
    // wrap gui.add_inspection_listener()
    add_inspection_listener(from_module, to_module, command, args) {
        var request = command+"/"+args
        // whenever there will be a message matching this request, the widget will be notified
        if (request in gui.listeners && ! gui.listeners[request].includes(this)) gui.listeners[request].push(this)
        else gui.listeners[request] = [this]
        var topic = gui.add_inspection_listener(from_module, to_module, command, args)
        // keep track of the topic subscribed
        gui.topics.push(topic)
        return topic
    }
    
    // wrap gui.add_broadcast_listener()
    add_broadcast_listener(from_module, command, args) {
        return this.add_inspection_listener(from_module, "*/*", command, args)
    }
    
    // wrap gui.add_configuration_listener()
    add_configuration_listener(configuration) {
        // if the requested configuration was already received, pass it along to the widget
        for (var item in gui.configurations) {
            if (topic_matches_sub(configuration, item)) {
                var message = new Message(gui)
                message.args = item
                message.set_data(gui.configurations[item])
                this.on_configuration(message)
            }
        }
        // TODO: this is in common with the previous
        // add this widget to the array of requests or create the array if needed
        if (configuration in gui.listeners && ! gui.listeners[configuration].includes(this)) gui.listeners[configuration].push(this)
        else gui.listeners[configuration] = [this]
        // subscribe to the requested configuration
        var topic = gui.add_configuration_listener(configuration)
        gui.topics.push(topic)
        return topic
    }
    
    // remove this object from the queue of listeners for the given configuration without unsubscribing the topic
    remove_configuration_listener(configuration) {
        if (! (configuration in gui.listeners)) return
        var index = gui.listeners[configuration].indexOf(this)
        if (index > -1) gui.listeners[configuration].splice(index, 1)
    }
    
    // wrap gui.send() keeping track of the requesting widget
    send(message) {
        var request_id = message.get_request_id()
        // map the request with this widget
        gui.requests[request_id] = this
        // send the message
        gui.send(message)
    }
}