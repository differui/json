var data = {
    '\n': 12e-12
};

var data0 = {
    a: [  'foo', 'bar' ]
}

var data1 = {
    a: 1,
    b: 2,
    c: true,
    d: [ true, true, true ]
};

var data11 = [ 1, 2, 3 ];

var data2 = {
    a: [
        { ka: 'ka', kb: 'kb' },
        { ka: 'ka' },
        { ka: 'ka' },
        [
            'foo',
            'bar',
            [
                'fooa',
                'bara',
                { ka: 'ka' }
            ]
        ]
    ]
};

var data3 = {
    a: [
        [ 'foo', 'bar' ],
        [ 'foo', [ 'bara', 'barb' ] ]
    ]
};

console.log(
    json.parse(JSON.stringify(data3))
);
