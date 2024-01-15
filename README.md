# hcl-table

**A table/grid module for Angular**

**Fast built of rich and functional tables/grids**

[Full documentation and examples](http://www.hclatom.net/hcl-table/example-app)

## install & get started
install the module to your angular application :

`npm i hcl-table`

In the app module (or any concerned module), import the hcl-table module :

`import { HclTableModule } from 'hcl-table';`

In the component.ts :

```
import { Component } from '@angular/core';

@Component( {
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.scss']
    })
export class ExampleComponent  {

    def: any = {
        cols: [
            {
                headerLabel: 'Col A',
                dataProp: 'cola'
            },
            {***
                headerLabel: 'Col B',
                dataProp: 'colb'
            }
        ]
    }

    data: any = [
        {
            cola: a1,
            colb: b1,
        },
        {
            cola: a2,
            colb: b2,
        }
    ]
}
```

In component.html :

    `<hcl-table [def]="def" [data]="data"></hcl-table>`


Further we will see that the [data] attribute is even useless if the table uses the serverData mode (see below). We will also see that the optional attribute (output) can be added to collect the table emissions, if needed, for instance if the click on a cell must return the characteristic of this cell, to open a corresponding modal for instance :

    `<hcl-table [def]="def" [data]="data" (output)="myCallBack($event)"></hcl-table>`

In this code, myCallBack($event) is a function of the parent app that has to deal with the table emissions (see example). The HTML tag declaring any hcl-table will never be more complex.

## Configuring the table

The configuration of the table is all contained into a Def interface. At least the table needs the column definitions (see bellow), but there are other functionalities that apply optionally to the whole table. The Def interface is strutured as follows (reminder: ? means "optional", a * points a default value) :
```
interface Def {
    cols: Column[];                 // Column definitions (see below). This is the only mandatory property of the object Def
    groupHeaders?: GroupHeader[][]; // see below.
    id?: string;                    // useful if many tables have the same output callback in the parent app,
                                    // or in case of nested tables.
    height?: number;                // the height in px of the table's viewport (the full table is displayed by default).
                                    // If below the table's height, the table is scrollable, otherwise the table is fully displayed.
    stripped?: boolean;             // [false* | true] wether or not the rows are stripped.
                                    // A custom class for the stripped rows can be declared in the css property of the Def interface (see below).
    selectable?: boolean;           // [false* | true] wether or not any zone of the table can be selected (see below "selection facilities").
    mouseHighlight?: {              // highlighting the rows/cols on mouseover.
        row: boolean;               // [false* | true]
        col: boolean;               // [false* | true]
    };
    serverData?: ServerData;        // See below "Direct connection to a server"
    paging?: {
        pageLength: number;         // number of displayed rows on each page (overriden in serverData mode)
        currentPage: number;        // first page displayed to the user (overriden in serverData mode)
        position: string;           // ['bottom-center'* | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right']
    };
    liveUpdateReference?: string;   // data property of unique id used to reconciliate incoming and new data, see below "Live Update"
    css?: {                         // here are specified the css classes to build custom looks for your tables
                                    // The classes must be defined into the style.css of the Angular application
        table?: string;
        th?: string;
        td?: string;
        stripped?: string;
        tdOpenClose?: string;       // open/close subrow cell
        tdSubrowContent?: string;
        mouseHighlight?: {
            row?: string;
            col?: string;
            cell?: string;
        },
        cellSelected?: string;
        chevronDown?: string;
        chevronUp?: string;
        inputSearch?: string;
        edit: {
            popup?: string;
            currentValue?: string;
            cancelButton?: string;
            confirmButton?: string;
            validateButton?: string;
            inputText?: string;
            inputNumber?: string;
            inputDate?: string;
            textarea?: string;
            checkbox?: string;
            select?: string;
        }
    }
}
```
## Configuring a column

The def object must define the structure of each column, therefore it collects the column definitions into the cols array :
```
def = {
    ...
    cols: Column[];
}
```
The Column interface is structured as follows (reminder: ? means "optional", a * points a default value) :
```
interface Column {
    headerLabel: string;                    // The string appearing in the header of the column
    dataProp: string;                       // The corresponding property name in the data rows
    type?: string;                          // type of data in cell ['text'* | 'number' | 'image' | 'subrow' | 'live']
                                            // For 'image', the corresponding data, data[n][dataProp], must be the url of the image
                                            // For 'subrow', see below "Using subrows"
                                            // For 'live', see below "Real time specific update"
    liveUpdateOptions?: LiveUpdateOptions;  // definition of possible options for live update configuration (see below)
                                            // see "Real time specific update"
    halign?: {                              // horizontal align
        th?: string;                        // for headers ['left'* | 'center' | 'right']
        td?: string;                        // for cells ['left'* | 'center' | 'right']
    };
    valign?: {                              // vertical align
        th?: string;                        // for headers ['top'* | 'middle' | 'bottom']
        td?: string;                        // for cells ['top'* | 'middle' | 'bottom']
    };
    css?: {
        th?: string;                        // css class name to apply to the header cell
        td?: string;                        // css class name to apply to the cells
                                            // The classes must be defined into the style.css of the Angular application
    };
    clickable?: boolean;                    /* [false* | true] a click on the cell will output the characteristics of the cell
                                                by the means of the "output" callback defined in the HTML tag
                                                <hcl-table (output)="myCallbackFunction($event) ... >.
                                                Receiving this message from the table, the parent application can fire any functionality;
                                                The table will emit the following format :
                                                {
                                                    request: 'cell-clicked'
                                                    tableId: string|undefined;  // the table id (usefull if many tables on the same page)
                                                    row: any;                   // the whole data row of the clicked cell
                                                    col: string;                //data property of the clicked cell
                                                }
                                            */
    sortable?: boolean;                     // [false* | true] sorting chevrons will appear in the header of the column
    searchable?: boolean;                   // [false* | true] a search input will appear in the header of the column
    filter?: function;                      /* a local function that turns the data of the cell into something else.
                                                must return the following format:
                                                {
                                                    value: string|number;   // the filtered value. Can be an image url if the type
                                                                            // of the cell is set to 'image'.
                                                    css?: string;           // the css class to apply to the cell
                                                }
                                            */
    editable?: {                            // the user's double click on a cell opens an edition popup (css can be configured in the
                                            // css property of Def, see below)
        confirm?: boolean;                  // a confirmation is asked before validating a change of data [false* | true]
        type?: string;                      // type of tag used for edition
                                            // ['input-text'* | 'input-number' | 'textarea' | 'checkbox' | 'select' | 'date']
        list?: string[];                    // required for a select tag, list of the possible values
        format?: string[];                  // required for a date tag: dd/mm/yyyy or mm/dd/yyyy, the separator /
                                            // migh be - or . or ' ' character.
        serverValidation?: string;          /* api url to call for validation on data change.
                                                The api must be a POST method
                                                The payload sent by the table to the POST api is:
                                                {
                                                    request: 'data-change'
                                                    tableId: string|undefined;
                                                    row: any;       // the whole data row including the changed data
                                                    col: string;    // data property of the changed data
                                                }

                                                The api must return the following format:
                                                {
                                                    success: boolean;   // tells if the update was successful or not,
                                                                        // an information popup appears on the upper left corner of the table.
                                                    message?: string;   // message if necessary, displayed in the information popup
                                                }

                                                without serverValidation, the table emits the same payload as above,
                                                by the means of the (ouput) attribute of the table.
                                            */


    }
    def?: Def;                              // definition of the sub-table displayed if the column is of type 'subrow'
                                            // see Using subrows
}
```


## Configuring group headers
The def object can define some group headers, displayed on the top of the table's header :
```
def = {
    ...
    groupHeaders?: GroupHeader[][];
}
interface GroupHeader {
    label: string;       // the displayed label
    colspan: number;     // the colspan
}
```
For instance, the following definition will display a top group header spanning 9 columns, and a second group header bellow, displaying two cells, one spanning 3 columns, the other 6 :
```
def = {
    ...
    groupHeaders: [
        [
        {
            label: "Commercial report",
            colspan: 9
        }
        ],
        [
        {
            label: "User identity",
            colspan: 3
        },
        {
            label: "Activity",
            colspan: 6
        }
        ]
    ]
}
```

## Data format
The data must be an array of objects:
    `data: any[] = [];`
Any object can suite, provided that it contains at least the properties declared as dataProp in def.cols. The data properties that are not corresponding to any dataProp are kept silent for the user, but any output from the table will take account of all the properties of the data, silent or not. It might be usefull indeed to kep a property "id" in the table rows, in order to reference the data row, without displaying it to the user.
The data properties can only type of [number | string | boolean]. It can not be an object.
Here is an example of a data row :
```
{
    id: 2,
    firstname: 'Demetre',
    lastname: 'Shewon',
    email: 'dshewon1@amazoniaws.com',
    image: 'https://myexample.com/pictures/cat.jpg',
    quantity: 8184,
    total: 66519.33,
    due: 2014.12,
    available: true,
    comment: 'Cras pellentesque volutpat dui.',
    nat: 'GB'
}
```
However, a proprety can be an array in case a subrow has been attached to this property. For instance :
```
{
    ...
    due: 2014.12,
    available: true,
    comment: 'Cras pellentesque volutpat dui.',
    nat: 'GB',
    detail: [
        {
            sector: 'Capital Goods',
            quantity: 6,
            total: 648.94,
            instock: false
        },
        ...
    ]
}
```
In the present example the rows of the data property "detail" will be the rows displayed in the sub-table, when opening the subrow (see below Using subrows)


## Selection facilities
If def.selectable is set to true, the user can select any zone of the table, either with the mouse or with the keyboard. The selection keys are the following :
```
Key	                        Action

ctrl + a	                Select all the table (ctrl+q on qwerty)
ctrl + space	            Select the column where the mouse pointer is
shift + space	            Select the row where the mouse pointer is
ctrl + shift	            Select the cell where the mouse pointer is
ctrl + shift + arrow_key	Add the cells up/down/left/right to the selected zone
escape	                    Unselect the zone
ctrl + c	                Copy the data selected into the clipboard in a CSV format, can be pasted anywhere else (ex: Excel)
```

## Direct connection to a server
The first way to populate the table with data rows is to inject the data into the `[data]` attribute of the `<hcl-table [data]="mydata" ...>`. The parent app can call a server to retreive the data, and then inject them into `[data]`.

The hcl-table proposes a more sophisticated way of being connected to a server. If the property def.serverData is populated, it means that the table must ask for data to a server by its own. Depending on the api, we must configurate the url and the method, of course, but more important is the paging/sorting/searching based on the server.
To not overload the frontend, the best practice is to use a server paging/sorting/searching : when the user clicks to ask a new page, the server is called, which looks for the required data, that are answered to the frontend. This way of doing things remains the frontend light, because it loads only the displayed data. In this case the options of the api call will contain the paging parameters required by the frontend.
The paging can be replaced by a virtual scroll, still based on the server, requireing the same options.
The def.serverData is defined as the following interface :
```
interface  ServerData: {
    url: string;                // api url to request for data
    method: string;             // method of the api ['post' | 'get']
    virtualScroll: boolean;     // [false* | true] infinite scroll from the server, with the same api as paging
    options?: Options;          // this the payload that will be sent to the api
};
```
The api must be able to retrieve the required data from the server, using the following interface for def.serverData.options :
```
interface Options {
    sort?: {                    // only one column can be sorted at a time
        dataProp: string;
        sortOrder: string;      // ['none'* | 'up' | 'down']
    }
    search?: {                  // an array of couples (property, serch string)
        dataProp: string;
        searchString: string;
    }[];
    paging?: {                  // necessary for server paging, to tell the server which data we require
        pageLength: number;     // number of rows to display per page
        requestPage: number;
    }

}
```
## Using subrows
If a column definition is set to type: 'subrow', this column will display a special cell containing only a chevron. This cell, and the chevron can be customized with the property def.css.tdOpenClose. This cell can be placed any where in the column order.

The subrows of the hcl-table are intended to display another hcl-table, below the clicked row. Therefore the column configuration must contained a def property of interface Def, for instance :
```
def = {
    ...
    cols: [
        ...
        {
            headerLabel: '',
            dataProp: 'detail',
            openCloseAll: true, // [false* | true] will display a chevron in the header
                                // that enable to open/close all the subrows of the table
            type: 'subrow',
            def: {
                id: 'sub-table',
                cols: [...],
                ...
            }
        }
    ]
}
```
In this case the data must set an array of rows for the concerned property detail in the above example. Here is an example :
```
    ... ,
    {
        ...
        due: 2014.12,
        available: true,
        comment: 'Cras pellentesque volutpat dui.',
        nat: 'GB',
        detail: [
            {
                sector: 'Capital Goods',
                quantity: 6,
                total: 648.94,
                instock: false
            },
            ...
        ]
    },
    ...
```
Each item of the array detail will be a row of data for the sub-table displayed as a subrow of the main table. The subrow table has exactly the same properties and functionalities as any hcl-table.

## Real time cell update
It is useful to update some specific cells in the grid. For instance the traders need such facility in real time to display evolving values of bonds. To be updatable in real time, a column must be of type "live", possibly with options :
```
def = {
    ...
    cols: [
        ...
        {
            ...
            type: 'live',
            liveUpdateOptions : LiveUpdateOptions // optional
        }
    ]
}
```
The interface LiveUpdateOptions is defined as follows :
```
interface LiveUpdateOptions {
    type: string;             // ['number', 'text']
    showOldValue?: boolean;   // show old value
    showDelta?: boolean;      // show delta between old and new value
    flashBackground?: {
        up?: string;            // default is '#fcc'
        down?: string;          // default is '#cfc'
        equal?: string;         // default is 'transparent'
        delay?: number;         // duration of the flash background, in ms
    };
    css?: {                   // css classes for the content of flashing cells
        newValue?: string;
        oldValue?: string;
        delta?: {
        up?: string;
        down?: string;
        equal?: string;
        };
    };
};
```
The attribute [data] is used to fillup the table at first. Then this same attribute is also used to inject the updated data, which must have the following format :
```
[
    ...
    {
        xxxxxx: string|number,  // where xxxxxx is the def.liveUpdateReference for old/new data reconciliation
        yyyyyy: string|number,  // where yyyyyy is the col.dataProp of the new value
    }
    ...
]
```
The updates must then be performed cell by cell, there is no "row update" facility.

Note that if a value comes with a liveUpdateReference which is not already present, a new row is added.






This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.5.
