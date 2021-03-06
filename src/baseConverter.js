'use strict';

const debug = require('debug')('xsd2jsonschema:BaseConverter')

const Qname = require('./qname');
const jsonSchemaTypes = require('./jsonschema/jsonSchemaTypes');
const NamespaceManager = require('./namespaceManager');
const JsonSchemaFile = require('./jsonschema/jsonSchemaFile');
const BuiltInTypeConverter = require('./builtInTypeConverter');
const XTotvs = require('./TotvsElements/xtotvs');
const xTotvsMessage = require('./TotvsElements/xTotvsMessage');
const xTotvsProductInformation = require('./TotvsElements/xTotvsProductInformation');
const InfoTotvs = require('./TotvsElements/InfoTotvs');
const Processor = require('./processor');
const XsdElements = require('./xmlschema/xsdElements');
const XsdAttributes = require('./xmlschema/xsdAttributes');
const XsdAttributeValues = require('./xmlschema/xsdAttributeValues');
const XsdNodeType = require('./xmlschema/xsdNodeTypes');
const utils = require('./utils');
const XsdFile = require('./xmlschema/xsdFileXmlDom');
const BaseSpecialCaseIdentifier = require('./baseSpecialCaseIdentifier');
const SpecialCases = require('./specialCases');


const builtInTypeConverter_NAME = Symbol();
const NamespaceManager_NAME = Symbol();
const LISTOF = "ListOf";

/**
 * Class representing a collection of XML Handler methods for converting XML Schema elements to JSON Schema.  XML
 * handler methods are methods used to convert an element of the corresponding name an equiviant JSON Schema
 * representation.  Handlers all check the current state (i.e. thier parent node) to determine how to convert the
 * node at hand.  See the {@link BaseConverter#choice|choice} handler for a complex example.
 *
 * Subclasses can override any handler method to customize the conversion as needed.
 *
 * @see {@link ParsingState}
 */

class BaseConverter extends Processor {
	/**
	 * Constructs an instance of BaseConverter.
	 * @constructor
	 */
	constructor(options) {
		super();
		if (options != undefined) {
			this.builtInTypeConverter = options.builtInTypeConverter != undefined ? options.builtInTypeConverter : new BuiltInTypeConverter();
			this.specialCaseIdentifier = options.specialCaseIdentifier != undefined ? options.specialCaseIdentifier : new BaseSpecialCaseIdentifier();
			this.namespaceManager = options.namespaceManager != undefined ? options.NamespaceManager : new NamespaceManager();
		} else {
			this.builtInTypeConverter = new BuiltInTypeConverter();
			this.specialCaseIdentifier = new BaseSpecialCaseIdentifier();
			this.namespaceManager = new NamespaceManager();
		}
		// The working schema is initilized as needed through XML Handlers
	}

	// Getters/Setters

	get NamespaceManager() {
		return this[NamespaceManager_NAME];
	}
	set NamespaceManager(newNamespaceManager) {
		this[NamespaceManager_NAME] = newNamespaceManager;
	}

	get builtInTypeConverter() {
		return this[builtInTypeConverter_NAME];
	}
	set builtInTypeConverter(newBuiltInTypeConverter) {
		this[builtInTypeConverter_NAME] = newBuiltInTypeConverter;
	}

	dumpJsonSchema(jsonSchema) {
		Object.keys(jsonSchema).forEach(function (prop, index, array) {
			debug(prop + '=' + jsonSchema[prop]);
		});
	}

	/**
	 * Creates a namespaces for the given namespace name.  This method is called from the schema XML Handler.
	 *
	 * @see {@link NamespaceManager#createNamespace|NamespaceManager.createNamespace()}
	 */
	initializeNamespaces(xsd) {
		Object.keys(xsd.namespaces).forEach(function (namespace, index, array) {
			this.namespaceManager.addNamespace(xsd.namespaces[namespace]);
		}, this);
	}

	/**
	 * This method is called for each node in the XML Schema file being processed.  It first processes an ID attribute if present and
	 * then calls the appropriate XML Handler method.
	 * @param {Node} node - the current {@link https://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-745549614 element} in xsd being converted.
	 * @param {JsonSchemaFileV4} jsonSchema - the JSON Schema representing the current XML Schema file {@link XsdFile|xsd} being converted.
	 * @param {XsdFile} xsd - the XML schema file currently being converted.
	 *
	 * @returns {Boolean} - handler methods can return false to cancel traversal of {@link XsdFile|xsd}.  An XML Schema handler method
	 *  has a common footprint and a name that corresponds to one of the XML Schema element names found in {@link module:XsdElements}.
	 *  For example, the <choice> handler method is <pre><code>choice(node, jsonSchema, xsd)</code></pre>
	 */
	process(node, jsonSchema, xsd) {
		var id = XsdFile.getAttrValue(node, XsdAttributes.ID);
		if (id !== undefined) {
			var qualifiedTypeName = new Qname(id);
			this.workingJsonSchema.addAttributeProperty(qualifiedTypeName.getLocal(), this.createAttributeSchema(node, jsonSchema, xsd, qualifiedTypeName));
		}
		if (!this[XsdFile.getNodeName(node)]) {
			//console.log("Metodo nao implementado:" + XsdFile.getNodeName(node));
			throw { 
					message: "Metodo nao implementado:" + XsdFile.getNodeName(node), 
					stack: ""
				  };			
		} else {
			const keepProcessing = this[XsdFile.getNodeName(node)](node, jsonSchema, xsd);
			super.process(node, jsonSchema, xsd);
			return keepProcessing;
		}
	}

	whiteSpace(node, jsonSchema, xsd) {
		// TODO: Implementar.
		// (TBD)

		return false;
	}

	all(node, jsonSchema, xsd) {
		// TODO: id, minOccurs, maxOccurs
		// (TBD)

		return true;
	}

	alternative(node, jsonSchema, xsd) {
		// TODO: id, test, type, xpathDefaultNamespace
		// (TBD)
		return true;
	}

	annotation(node, jsonSchema, xsd) {
		// TODO: id
		// Ignore this grouping and continue processing children
		return true;
	}

	any(node, jsonSchema, xsd) {
		// TODO: id, minOccurs, maxOccurs, namespace, processContents, notNamespace, not QName
		// (TBD)
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.CHOICE:
				throw new Error('any() needs to be implemented within choice!');
			case XsdElements.SEQUENCE:
				throw new Error('any() needs to be implemented within sequence!');
			case XsdElements.ALL:
				throw new Error('any() needs to be implemented within all!');
			case XsdElements.OPEN_CONTENT:
				throw new Error('any() needs to be implemented within openContent!');
			case XsdElements.DEFAULT_OPEN_CONTENT:
				throw new Error('any() needs to be implemented within defaultOpenContent');
			default:
				throw new Error('any() called from within unexpected parsing state!');
		}
		return true;
	}

	anyAttribute(node, jsonSchema, xsd) {
		// TODO: id, namespace, processContents, notNamespace, not QName
		// (TBD)
		return true;
	}

	appinfo(node, jsonSchema, xsd) {
			var messageDocCounter = 0;
			for(var childNodeIndex in node.childNodes) {
				if (node.childNodes[childNodeIndex].localName == "MessageDocumentation") {
					messageDocCounter++;
				}
			}		

			if(messageDocCounter >= 2){
				jsonSchema.hasMultipleMessageInfo = true;				
			}		

		return true;
	}

	FieldDocumentation(node, jsonSchema, xsd) {

		var productAttr = XsdFile.getAttrValue(node, XsdAttributes.PRODUCT);
		var prop = this.getCurrentProperty(this.workingJsonSchema, 1);
		var obj = new XTotvs();

		var list = [];
		obj.product = productAttr;
		if (prop) {
			if (prop.name && prop.name.toLowerCase().startsWith(LISTOF.toLowerCase()) && this.isObjectWithProperties(prop.obj.items.properties)) {
				var childProp = this.getCurrentProperty(prop.obj.items, 1);

				list = Object.assign([], childProp.obj.xtotvs);

				list.push(obj);
				childProp.obj.xtotvs = list;

				this.addProperty(prop.obj.items, childProp.name, childProp.obj, null);

			} else {
				if (prop.haveProperties) {
					var childProp = this.getCurrentProperty(prop.obj, 1);

					list = Object.assign([], childProp.obj.xtotvs);

					list.push(obj);
					childProp.obj.xtotvs = list;

					this.addProperty(prop.obj, childProp.name, childProp.obj, null);
				} else {
					list = Object.assign([], prop.obj.xtotvs);
					list.push(obj);
					prop.obj.xtotvs = list;
					this.addProperty(this.workingJsonSchema, prop.name, prop.obj, null);
				}
			}
		} else {
			list = Object.assign([], this.workingJsonSchema.xtotvs);
			list.push(obj);
			this.workingJsonSchema.xtotvs = list;
		}


		// }


		return true;
	}

	isObjectWithProperties(obj) {
		if (obj) {
			return Object.keys(obj).length > 0;
		} else {
			return false;
		}

	}

	MessageDocumentation(node, jsonSchema, xsd) {
		jsonSchema.info = new InfoTotvs();
		let messageInfo = this.handleMessageName(jsonSchema.filename);
		jsonSchema.info.xTitle = messageInfo.title;
		jsonSchema.info.xVersion = messageInfo.version;
		if(jsonSchema.hasMultipleMessageInfo){
			jsonSchema.info._warningConversorAuto = "A tag MessageDocumentation está duplicada no XML. O valor de 'info' pode ter sido gerado incorretamente";
		}
		return true;
	}

	handleMessageName(filename) {
		let messageName = filename.replace(/_/g, ".").split(".");

		let retorno = {
			title: "",
			version: ""
		};
		retorno.title = messageName[0];
		retorno.version = messageName[1] + "." + messageName[2];

		return retorno;
	}

	assert(node, jsonSchema, xsd) {
		// TODO: id, test, xpathDefaultNamespace
		// (TBD)
		return true;
	}

	assertion(node, jsonSchema, xsd) {
		// TODO: id, test, xpathDefaultNamespace
		// (TBD)
		return true;
	}

	/*
	 * A factory method to create JSON Schemas of one of the XML Schema built-in types.
	 *
	 */
	createAttributeSchema(node, jsonSchema, xsd, qualifiedTypeName) {
		var attributeJsonSchema = new JsonSchemaFile();
		this.builtInTypeConverter[qualifiedTypeName.getLocal()](node, attributeJsonSchema)
		return attributeJsonSchema;
	}

	handleAttributeGlobal(node, jsonSchema, xsd) {
		var name = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		var typeName = XsdFile.getAttrValue(node, XsdAttributes.TYPE);
		// TODO: id, default, fixed, inheritable (TBD)
		var attributeJsonSchema;

		this.parsingState.pushSchema(this.workingJsonSchema);
		if (typeName !== undefined) {
			var qualifiedTypeName = new Qname(typeName);
			attributeJsonSchema = this.namespaceManager.getGlobalAttribute(name, jsonSchema);
			jsonSchema.getGlobalAttributesSchema().addSubSchema(name, attributeJsonSchema);
			return this.builtInTypeConverter[qualifiedTypeName.getLocal()](node, attributeJsonSchema);
		} else {
			// Setup the working schema and allow processing to continue for any contained simpleType or annotation nodes.
			attributeJsonSchema = this.namespaceManager.getGlobalAttribute(name, jsonSchema);
			jsonSchema.getGlobalAttributesSchema().addSubSchema(name, attributeJsonSchema);
			this.workingJsonSchema = attributeJsonSchema;
		}
		return true;
	}

	handleAttributeLocal(node, jsonSchema, xsd) {
		var name = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		var type = XsdFile.getAttrValue(node, XsdAttributes.TYPE);
		var use = XsdFile.getAttrValue(node, XsdAttributes.USE);
		// TODO: id, form, default, fixed, targetNamespace, inheritable (TBD)

		this.parsingState.pushSchema(this.workingJsonSchema);
		if (type !== undefined) {
			var qualifiedTypeName = new Qname(type);
			this.workingJsonSchema.addAttributeProperty(name, this.createAttributeSchema(node, jsonSchema, xsd, qualifiedTypeName), use);
		} else {
			// Setup the working schema and allow processing to continue for any contained simpleType or annotation nodes.
			var attributeJsonSchema = new JsonSchemaFile();
			this.workingJsonSchema.addAttributeProperty(name, attributeJsonSchema, use);
			this.workingJsonSchema = attributeJsonSchema;
		}
		return true;
	}

	handleAttributeReference(node, jsonSchema, xsd) {
		const ref = XsdFile.getAttrValue(node, XsdAttributes.REF);
		const use = XsdFile.getAttrValue(node, XsdAttributes.USE);
		// TODO: id, default, fixed, inheritable (TBD)

		if (ref !== undefined) {
			var attrSchema = this.namespaceManager.getGlobalAttribute(ref, jsonSchema);
			this.workingJsonSchema.addAttributeProperty(ref, attrSchema.get$RefToSchema(), use);
		}

		return true;
	}

	attribute(node, jsonSchema, xsd) {
		// (TBD)
		//dumpNode(node);
		if (XsdFile.isReference(node)) {
			return this.handleAttributeReference(node, jsonSchema, xsd);
		} else if (this.parsingState.isTopLevelEntity()) {
			return this.handleAttributeGlobal(node, jsonSchema, xsd);
		} else {
			return this.handleAttributeLocal(node, jsonSchema, xsd);
		}
	}

	handleAttributeGroupDefinition(node, jsonSchema, xsd) {
		// TODO id, name
		// (TBD)
	}

	handleAttributeGroupReference(node, jsonSchema, xsd) {
		// TODO id, ref (TBD)
	}

	attributeGroup(node, jsonSchema, xsd) {
		// (TBD)
		return true;
	}

	handleChoiceArray(node, jsonSchema, xsd) {
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		// TODO: id
		// (TBD Don't forget to support singles)
		throw new Error('choice array needs to be implemented!!');
		return true;
	}

	allChildrenAreOptional(node) {
		var retval = true;
		const children = Array.from(node.childNodes);
		children.forEach(function (childNode) {
			if (childNode.nodeType != XsdNodeType.TEXT_NODE) {
				const minOccursAttr = XsdFile.getAttrValue(childNode, XsdAttributes.MIN_OCCURS);
				if (minOccursAttr != 0) {
					retval = false;
				}
			}
		})
		return retval;
	}

	choice(node, jsonSchema, xsd) {
		// TODO: id
		const minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		const maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		const isAnyOfChoice = this.specialCaseIdentifier.isAnyOfChoice(node, xsd);
		if (isAnyOfChoice === true) {
			this.specialCaseIdentifier.addSpecialCase(SpecialCases.ANY_OF_CHOICE, this.workingJsonSchema, node);
			// This could be optional too.  Need a test!
		}
		const isArray = (maxOccursAttr !== undefined && (maxOccursAttr > 1 || maxOccursAttr === XsdAttributeValues.UNBOUNDED));
		if (isArray) {
			return this.handleChoiceArray(node, jsonSchema, xsd);
		}
		const isOptional = this.specialCaseIdentifier.isOptional(node, xsd, minOccursAttr);
		const allChildrenAreOptional = this.allChildrenAreOptional(node);
		const isSiblingChoice = this.specialCaseIdentifier.isSiblingChoice(node, xsd);
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.CHOICE:
				throw new Error('choice() needs to be implemented within choice');
			case XsdElements.COMPLEX_TYPE:
				// Allow to fall through and continue processing.  The schema is estabished with the complexType.
				//throw new Error('choice() needs to be implemented within complexType');
				break;
			case XsdElements.EXTENSION:
				throw new Error('choice() needs to be implemented within extension');
			case XsdElements.GROUP:
				// Allow to fall through and continue processing.  The schema is estabished with the group.
				//throw new Error('choice() needs to be implemented within group');
				break;
			case XsdElements.RESTRICTION:
				throw new Error('choice() needs to be implemented within restriction');
			case XsdElements.SEQUENCE:
				if (isSiblingChoice) {
					var allOfSchema = new JsonSchemaFile();
					this.workingJsonSchema.allOf.push(allOfSchema);
					this.parsingState.pushSchema(this.workingJsonSchema);
					this.workingJsonSchema = allOfSchema;
					if (isAnyOfChoice === true) {
						// Ducktype it on there for now.  This is checked in baseSpecialCaseIdentifier.fixAnyOfChoice.
						// It is needed because all sibling choices may not be anyOfChoices.
						allOfSchema.isAnyOfChoice = true;
					}
				}
				if (!allChildrenAreOptional && isOptional) {
					var optionalChoiceSchema = new JsonSchemaFile();
					this.workingJsonSchema.anyOf.push(optionalChoiceSchema);
					// Add an the optional part (empty schema)
					var emptySchema = new JsonSchemaFile();
					emptySchema.description = "This truthy schema is what makes an optional <choice> optional.  This needs a better solution because it allows anything."
					this.workingJsonSchema.anyOf.push(emptySchema);
					if (!isSiblingChoice) {
						this.parsingState.pushSchema(this.workingJsonSchema)
					}
					this.workingJsonSchema = optionalChoiceSchema;
					// The optional part will be added as a special case
					this.specialCaseIdentifier.addSpecialCase(SpecialCases.OPTIONAL_CHOICE, this.workingJsonSchema, node);
				} else {
					// This is an needless grouping just allow to fall through and continue processing
					// Allow to fall through and continue processing.
					// The schema should be estabished by the parent of the sequence.
					//  (Keep an eye on this one)
					//throw new Error('choice() needs to be implemented within sequence');
				}
				break;
			default:
				throw new Error('choice() called from within unexpected parsing state!');
		}
		return true;
	}

	comment(node, jsonSchema, xsd) {
		// do nothing - This is an XML comment (e.g. <!-- text -->)
		return true;
	}

	complexContent(node, jsonSchema, xsd) {
		// TODO: id, mixed
		// Ignore this grouping and continue processing children
		return true;
	}

	handleNamedComplexType(node, jsonSchema, xsd) {
		var nameAttr = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		// TODO: id, mixed, abstract, block, final, defaultAttributesApply

		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.SCHEMA:
				this.workingJsonSchema = this.namespaceManager.getType(nameAttr, jsonSchema, xsd);
				jsonSchema.addSubSchema(nameAttr, this.workingJsonSchema);
				if (nameAttr.toLowerCase().startsWith(LISTOF.toLowerCase())) {
					this.workingJsonSchema.type = jsonSchemaTypes.ARRAY;
				} else {
					this.workingJsonSchema.type = jsonSchemaTypes.OBJECT;
				}

				break;
			case XsdElements.REDEFINE:
				throw new Error('complexType() needs to be impemented within redefine');
			case XsdElements.OVERRIDE:
				throw new Error('complexType() needs to be impemented within override');
			default:
				throw new Error('complexType() called from within unexpected parsing state! state=' + state.name);
		}
		return true;
	}

	handleAnonymousComplexType(node, jsonSchema, xsd) {
		// TODO: id, mixed, defaultAttributesApply
		// Ignore this grouping and continue processing children
		return true;
	}

	complexType(node, jsonSchema, xsd) {
		if (XsdFile.isNamed(node)) {
			return this.handleNamedComplexType(node, jsonSchema, xsd);
		} else {
			return this.handleAnonymousComplexType(node, jsonSchema, xsd);
		}
	}

	defaultOpenContent(node, jsonSchema, xsd) {
		// TODO: schema
		// (TBD)
		return true;
	}

	documentation(node, jsonSchema, xsd) {
		// TODO: source, xml:lang
		// Ignore this grouping and continue processing children.  The actual text will come through the text() method.
		var state = this.parsingState.states[this.parsingState.states.length - 3];

		switch (state.name) {
			case XsdElements.ELEMENT:
				this.handleElementDocumentation(node, jsonSchema);
				break;
			case XsdElements.RESTRICTION:
				return false;
				break;
			case XsdElements.SIMPLE_TYPE:
			case XsdElements.COMPLEX_TYPE:
				if (this.parsingState.isSchemaBeforeState()) {
					this.workingJsonSchema.description = utils.handleText(node.textContent);
				} else {
					this.handleElementDocumentation(node);
				}
				break;
			default:
				//console.log(state.name);
		}


		return false;
	}


	handleElementDocumentation(node, jsonSchema) {
		let currentProp;


		currentProp = this.getCurrentProperty(this.workingJsonSchema, 1);

		if (currentProp) {
			if (currentProp.haveProperties) {
				let childProp = this.getCurrentProperty(currentProp.obj, 1);

				childProp.obj.description = utils.handleText(node.textContent);

				this.addProperty(currentProp.obj, childProp.name, childProp.obj, null);
			} else {

				if (currentProp.obj.type == jsonSchemaTypes.ARRAY && this.isObjectWithProperties(currentProp.obj.items.properties)) {
					let childProp = this.getCurrentProperty(currentProp.obj.items, 1);

					childProp.obj.description = utils.handleText(node.textContent);

					this.addProperty(currentProp.obj.items, childProp.name, childProp.obj, null);
				} else {
					currentProp.obj.description = utils.handleText(node.textContent);

					this.addProperty(this.workingJsonSchema, currentProp.name, currentProp.obj, null);
				}

			}
		} else {
			this.workingJsonSchema.description = utils.handleText(node.textContent);
		}


	}

	handleElementGlobal(node, jsonSchema, xsd) {
		var nameAttr = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		var typeAttr = XsdFile.getAttrValue(node, XsdAttributes.TYPE);
		// TODO: id, defaut, fixed, nillable, abstract, substitutionGroup, block, final

		if (typeAttr !== undefined) {
			var typeName = typeAttr;
			var customType = this.namespaceManager.getType(typeName, jsonSchema, xsd);
			var refType = customType.clone();
			refType.id = jsonSchema.id;
			this.namespaceManager.addTypeReference(nameAttr, refType, jsonSchema, xsd);
			this.workingJsonSchema = customType.get$RefToSchema();
			jsonSchema.addSubSchema(nameAttr, this.workingJsonSchema);
			//workingJsonSchema.type = jsonSchemaTypes.OBJECT;
		} else {
			this.workingJsonSchema = this.namespaceManager.getType(nameAttr, jsonSchema, xsd);
			jsonSchema.addSubSchema(nameAttr, this.workingJsonSchema);
			this.workingJsonSchema.type = jsonSchemaTypes.OBJECT;
		}
		if (this.parsingState.inChoice()) {
			throw new Error('choice needs to be implemented in handleElementGlobal()!');
		}
		return true;
	}

	addProperty(targetSchema, propertyName, customType, minOccursAttr) {
		/* Para a Totvs quando 	não houver minOccurs é para considerar como não obrigatório*/
		if (minOccursAttr === XsdAttributeValues.REQUIRED || minOccursAttr > 0) {
			targetSchema.addRequired(propertyName);
		}
		targetSchema.setProperty(propertyName, customType);
	}

	addChoiceProperty(targetSchema, propertyName, customType, minOccursAttr) {
		var choiceSchema = new JsonSchemaFile();
		//choiceSchema.additionalProperties = false;
		this.addProperty(choiceSchema, propertyName, customType, minOccursAttr);
		targetSchema.oneOf.push(choiceSchema);
	}

	formatMaxItemsProperty(max) {
		var maxItems;
		if (max === XsdAttributeValues.UNBOUNDED || max === undefined) {
			maxItems = undefined
		} else {
			maxItems = parseInt(max);
		}
		return maxItems;
	}

	addPropertyAsArray(targetSchema, propertyName, customType, minOccursAttr, maxOccursAttr) {
		var arraySchema = new JsonSchemaFile();
		arraySchema.type = jsonSchemaTypes.ARRAY;
		var min = minOccursAttr === undefined ? 0 : minOccursAttr;
		var max;
		if (!propertyName.toLowerCase().startsWith((LISTOF).toLowerCase())) { //Se o elemento começa com ListOf, o maxItems dele deve ser ignorado. O que interessa é o maxItems que se encontra no seu elemento filho.
			max = maxOccursAttr === undefined ? undefined : maxOccursAttr;
		}
		arraySchema.minItems = parseInt(min);
		arraySchema.maxItems = this.formatMaxItemsProperty(max);
		arraySchema.items = customType.get$RefToSchema();

		// Por definição, caso o retorno for 1 item, deve ser enviado um array de uma entidade e não uma entidade
		//if (min > 0) {
		//var oneOfSchema = new JsonSchemaFile();
		//oneOfSchema.oneOf.push(customType.get$RefToSchema());
		//oneOfSchema.oneOf.push(arraySchema);
		//	arraySchema.MaxIte
		//	this.addProperty(targetSchema, propertyName, oneOfSchema, minOccursAttr);
		//} else {
		this.addProperty(targetSchema, propertyName, arraySchema, minOccursAttr);
		//	}

	}

	addChoicePropertyAsArray(targetSchema, propertyName, customType, minOccursAttr, maxOccursAttr) {
		var choiceSchema = new JsonSchemaFile();
		//choiceSchema.additionalProperties = false;
		this.addPropertyAsArray(choiceSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
		targetSchema.oneOf.push(choiceSchema);
	}

	handleElementLocal(node, jsonSchema, xsd) {
		var nameAttr = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		var typeAttr = XsdFile.getAttrValue(node, XsdAttributes.TYPE);
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		// TODO: id, form, defaut, fixed, nillable, block, targetNamespace

		var lookupName;
		if (typeAttr !== undefined) {
			lookupName = typeAttr;
		}
		var propertyName = nameAttr; // name attribute is required for local element
		var type;
		var customType = new JsonSchemaFile();
		var isArray = (maxOccursAttr !== undefined && (maxOccursAttr > 1 || maxOccursAttr === XsdAttributeValues.UNBOUNDED)) || propertyName.toLowerCase().startsWith((LISTOF).toLowerCase());
		if (lookupName !== undefined) {
			type = this.namespaceManager.getType(lookupName, jsonSchema, xsd).get$RefToSchema();

			//REfatorar
			this.namespaceManager.builtInTypeConverter.transformType(customType, type);

		}

		if (!customType.type) {
			customType.type = jsonSchemaTypes.OBJECT;
		}

		var state = this.parsingState.getCurrentState();

		switch (state.name) {
			case XsdElements.CHOICE:
				if (this.specialCaseIdentifier.isOptional(node.parentNode, xsd) || this.allChildrenAreOptional(node.parentNode)) {
					if (isArray) {
						this.addPropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
					} else {
						this.addProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
					}
				} else {
					if (isArray) {
						this.addChoicePropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
					} else {
						this.addChoiceProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
					}
				}
				break;
			case XsdElements.SEQUENCE:
			case XsdElements.ALL:
				this.handleElementLocalinSequence(propertyName, customType, minOccursAttr, maxOccursAttr, isArray, jsonSchema)
				break;
			default:
				throw new Error('element() [local] called from within unexpected parsing state!');
		}
		return true;
	}

	handleElementLocalinSequence(propertyName, customType, minOccursAttr, maxOccursAttr, isArray, jsonSchema) {
		let prop = this.getCurrentProperty(this.workingJsonSchema, 1);
		if (isArray) {

			if (!this.parsingState.isSchemaBeforeState() && prop) {
				if (!propertyName.toLowerCase().startsWith((LISTOF).toLowerCase()) && prop.name && prop.name.toLowerCase().startsWith((LISTOF).toLowerCase())) {
					// var item = {};
					// if (this.isObjectWithProperties(prop.obj.items.properties)) {
					// 	item = prop.obj.items;
					// } else {
					// 	item = new JsonSchemaFile();
					// }
					//this.addProperty(item, propertyName, customType, minOccursAttr);
					prop.obj.maxItems = this.formatMaxItemsProperty(maxOccursAttr);
					prop.obj.addItems(customType.get$RefToSchema());
					this.addProperty(this.workingJsonSchema, prop.name, prop.obj, minOccursAttr);


				} else {
					this.addPropertyAsArray(prop.obj, propertyName, customType, minOccursAttr, maxOccursAttr);
				}

			} else {

				if (this.workingJsonSchema.type == jsonSchemaTypes.ARRAY) {
					let propSchema = this.getCurrentProperty(jsonSchema, 2);
					this.workingJsonSchema.items = customType.get$RefToSchema();
					this.workingJsonSchema.maxItems = this.formatMaxItemsProperty(maxOccursAttr);
					if (propSchema) {
						this.addProperty(jsonSchema, propSchema.name, this.workingJsonSchema, minOccursAttr);
					} else {
						this.addProperty(jsonSchema, propertyName, this.workingJsonSchema, minOccursAttr);
					}


				} else {
					this.addPropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
				}
			}

		} else {

			if (!this.parsingState.isSchemaBeforeState()) {

				if (prop && prop.name.toLowerCase().startsWith((LISTOF).toLowerCase())) {
					let item = {};
					if (this.isObjectWithProperties(prop.obj.items.properties)) {
						item = prop.obj.items;
					} else {
						item = new JsonSchemaFile();
					}
					this.addProperty(item, propertyName, customType, minOccursAttr);
					prop.obj.addItems(item);
					this.addProperty(this.workingJsonSchema, prop.name, prop.obj, minOccursAttr);
				} else {
					this.addProperty(prop.obj, propertyName, customType, minOccursAttr);

				}
			} else {
				this.addProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
			}
		}
	}

	handleElementReference(node, jsonSchema, xsd) {
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		var refAttr = XsdFile.getAttrValue(node, XsdAttributes.REF);
		// TODO: id

		// An element within a model group (such as 'group') may be a reference.  References have neither
		// a name nor a type attribute - just a ref attribute.  This is awkward when the reference elmenent
		// is a property of an object in JSON.  With no other options to name the property ref is used.
		var propertyName = refAttr; // ref attribute is required for an element reference
		var customType = this.namespaceManager.getType(propertyName, jsonSchema, xsd).get$RefToSchema();
		var isArray = (maxOccursAttr !== undefined && (maxOccursAttr > 1 || maxOccursAttr === XsdAttributeValues.UNBOUNDED));
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.CHOICE:
				if (this.specialCaseIdentifier.isOptional(node.parentNode, xsd) || this.allChildrenAreOptional(node.parentNode)) {
					if (isArray) {
						this.addPropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
					} else {
						this.addProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
					}
				} else {
					if (isArray) {
						this.addChoicePropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
					} else {
						this.addChoiceProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
					}
				}
				break;
			case XsdElements.SEQUENCE:
			case XsdElements.ALL:
				if (isArray) {
					this.addPropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
				} else {
					this.addProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
				}
				break;
			default:
				throw new Error('element() [reference] called from within unexpected parsing state!');
		}
		return true;
	}

	element(node, jsonSchema, xsd) {
		// var refAttr = XsdFile.getAttrValue(node, XsdAttributes.REF);

		// if (refAttr !== undefined) {
		// 	return this.handleElementReference(node, jsonSchema, xsd);
		// } else
		if (this.parsingState.isTopLevelEntity()) {
			return this.handleElementGlobal(node, jsonSchema, xsd);
		} else {
			return this.handleElementLocal(node, jsonSchema, xsd);
		}

	}

	enumeration(node, jsonSchema, xsd) {
		var val = XsdFile.getValueAttr(node);
		//DefaultValues
		var parentElementObj = this.workingJsonSchema;
		var elementObj = this.workingJsonSchema;
		var elementProperty = undefined;

		var current = this.getCurrentProperty(this.workingJsonSchema, 1);
		if (current && !this.parsingState.isSchemaBeforeState()) {			
			if (current.name.toLowerCase().startsWith((LISTOF).toLowerCase())) {
				elementProperty = this.getCurrentProperty(current.obj.items, 1);
				parentElementObj = current.obj.items;
			} else {
				parentElementObj.type = "string";
				
				if (current.haveProperties) {
					elementProperty = this.getCurrentProperty(current.obj, 1);	
				} else {
					elementProperty = current;
				}
			}
			elementObj = elementProperty.obj;
		}	

		this.handleEnumDescription(elementObj, val, node.textContent);
		this.handleEnum(parentElementObj, val, elementProperty);

		return true;
	}

	handleEnum(schema, value, property) {
		if (property) {
			property.obj.addEnum(value);
			this.addProperty(schema, property.name, property.obj, null);
		} else {
			schema.addEnum(value);
		}
	}

	handleEnumDescription(schema, valueEnum, descrEnum) {
		if (descrEnum) {
			if (!schema.description) {
				schema.description = valueEnum + " - " + descrEnum.trim();
			} else {

				schema.description = schema.description + " / " + valueEnum + " - " + descrEnum.trim();

			}
			schema.description = utils.handleText(schema.description);
		}
	}





	explicitTimezone(node, jsonSchema, xsd) {
		// TODO: id, fixed, value
		// (TBD)
		return true;
	}

	extension(node, jsonSchema, xsd) {
		var baseAttr = XsdFile.getAttrValue(node, XsdAttributes.BASE);
		// TODO: id
		var baseType = new Qname(baseAttr);
		var baseTypeName = baseType.getLocal();
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.COMPLEX_CONTENT:
				this.workingJsonSchema = this.workingJsonSchema.extend(this.namespaceManager.getType(baseTypeName, jsonSchema, xsd)) //, jsonSchemaTypes.OBJECT);
				break;
			case XsdElements.SIMPLE_TYPE:
				throw new Error('extension() needs to be impemented within simpleType!');
			default:
				throw new Error('extension() called from within unexpected parsing state!');
		}
		return true;
	}

	field(node, jsonSchema, xsd) {
		// TODO: id, xpath, xpathDefaultNamespace
		// (TBD)

		return true;
	}

	//Field x-totvs
	Field(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "Field");
	}

	//Required x-totvs
	Required(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "Required");
	}

	//Type x-totvs
	Type(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "Type");
	}

	//Description x-totvs
	Description(node, jsonSchema, xsd) {
		var field = "description";

		var state = this.parsingState.getCurrentState();

		switch (state.name) {
			case XsdElements.MESSAGE_DOCUMENTATION:
				this.handleXMessageTotvs(node, jsonSchema, field);
				break;
			case XsdElements.PRODUCT_INFORMATION:
				this.handleProductInformationItems(node, jsonSchema, "note");
				break;
			case XsdElements.FIELD_DOCUMENTATION:
				this.handleXTotvs(node, "note");
				break;
			default:
				this.handleXTotvs(node, field);
		}
	}

	//Length x-totvs
	Lenght(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "Length");
	}

	//Length x-totvs
	Length(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "Length");
	}
	
	InternalIdName(node, jsonSchema, xsd){
		//TODO - Verificar implementação desta tag.
	}

	//Length x-totvs
	Blabla(node, jsonSchema, xsd) {
		this.handleXTotvs(node, "blabla");
	}

	handleXTotvs(node, field) {

		// if (this.parsingState.inFieldDocumentation()) {
		var xtotvs = {}
		var qtd = 0;
		var prop = this.getCurrentProperty(this.workingJsonSchema, 1);

		if (prop) {
			if (prop.name && prop.name.toLowerCase().startsWith((LISTOF).toLowerCase()) && this.isObjectWithProperties(prop.obj.items.properties)) {
				var childProp = this.getCurrentProperty(prop.obj.items, 1);

				qtd = childProp.obj.xtotvs.length

				xtotvs = childProp.obj.xtotvs[qtd - 1];

			} else {
				qtd = prop.obj.xtotvs.length
				xtotvs = prop.obj.xtotvs[qtd - 1];
			}
		} else {
			qtd = this.workingJsonSchema.xtotvs.length
			xtotvs = this.workingJsonSchema.xtotvs[qtd - 1];
		}



		xtotvs[field] = utils.handleText(node.textContent);
		// }
	}

	Name(node, jsonSchema, xsd) {
		// if (this.parsingState.inMessageDocumentation()) {
		this.handleXMessageTotvs(node, jsonSchema, "xName");
		// }
	}

	Segment(node, jsonSchema, xsd) {
		// if (this.parsingState.inMessageDocumentation()) {
		this.handleXMessageTotvs(node, jsonSchema, "xSegment");
		// }
	}

	handleXMessageTotvs(node, jsonSchema, field) {
		if (!jsonSchema.info.xTotvs.messageDocumentation) {
			jsonSchema.info.xTotvs["messageDocumentation"] = new xTotvsMessage();
			jsonSchema.info.xTotvs.messageDocumentation[field] = node.textContent;
		} else {
			jsonSchema.info.xTotvs.messageDocumentation[field] = node.textContent;
		}

	}

	ProductInformation(node, jsonSchema, xsd) {
		var productAttr = XsdFile.getAttrValue(node, XsdAttributes.PRODUCT);

		// if (this.parsingState.inMessageDocumentation()) {

		if (!jsonSchema.info.xTotvs.productInformation) {
			jsonSchema.info.xTotvs["productInformation"] = [];
		}
		var obj = new xTotvsProductInformation();
		obj.product = productAttr;
		jsonSchema.info.xTotvs.productInformation.push(obj);
		// }
		return true;
	}



	Contact(node, jsonSchema, xsd) {
		this.handleProductInformationItems(node, jsonSchema, "xContact");
	}

	Adapter(node, jsonSchema, xsd) {
		this.handleProductInformationItems(node, jsonSchema, "xAdapter");
	}

	Send(node, jsonSchema, xsd) {
		return false;
	}

	Receive(node, jsonSchema, xsd) {
		return false;
	}

	handleProductInformationItems(node, jsonSchema, field) {
		let qtd = 0;
		qtd = jsonSchema.info.xTotvs.productInformation.length;

		let productInformation = jsonSchema.info.xTotvs.productInformation[qtd - 1];

		productInformation[field] = node.textContent;
	}


	fractionDigits(node, jsonSchema, xsd) {
		var val = XsdFile.getNumberValueAttr(node);

		var prop = this.getCurrentProperty(this.workingJsonSchema, 1);

		if (val) {
			val = parseFloat("1e-" + val);
			if (prop) {				
				if (prop.haveProperties) {
					let childProp = this.getCurrentProperty(prop.obj, 1);
					childProp.obj.multipleOf = val;
					this.addProperty(prop.obj, childProp.name, childProp.obj);
				} else {
					prop.obj.multipleOf = val;
					this.addProperty(this.workingJsonSchema, prop.name, prop.obj);
				}
			} else {
				this.workingJsonSchema.multipleOf = val;
			}
		}




		return true;
	}

	handleGroupDefinition(node, jsonSchema, xsd) {
		var nameAttr = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		// TODO: id

		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.SCHEMA:
				this.workingJsonSchema = this.namespaceManager.getType(nameAttr, jsonSchema, xsd);
				jsonSchema.addSubSchema(nameAttr, this.workingJsonSchema);
				this.workingJsonSchema.type = jsonSchemaTypes.OBJECT;
				break;
			case XsdElements.REDEFINE:
				throw new Error('group() [definition] needs to be impemented within restriction!');
			case XsdElements.OVERRIDE:
				throw new Error('group() [definition] needs to be impemented within choice!');
			default:
				throw new Error('group() [definition] called from within unexpected parsing state!');
		}
		return true;
	}

	handleGroupReferenceOld(node, jsonSchema, xsd) {
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var refName = XsdFile.getAttrValue(node, XsdAttributes.REF);
		// TODO: id, maxOccurs

		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.EXTENSION:
				throw new Error('group() [reference] needs to be impemented within extension!');
			case XsdElements.RESTRICTION:
				throw new Error('group() [reference] needs to be impemented within restriction!');
			case XsdElements.CHOICE:
				throw new Error('group() [reference] needs to be impemented within choice!');
			case XsdElements.COMPLEX_TYPE:
			case XsdElements.SEQUENCE:
			case XsdElements.ALL:
				/* Para a Totvs quando 	não houver minOccurs é para considerar como não obrigatório*/
				if (minOccursAttr > 0) {
					this.workingJsonSchema.addRequired(refName);
				}
				var customType = this.namespaceManager.getType(refName, jsonSchema, xsd);
				this.workingJsonSchema.setProperty(refName, customType.get$RefToSchema());
				break;
			default:
				throw new Error('group() [reference] called from within unexpected parsing state!');
		}
		return true;
	}

	handleGroupReference(node, jsonSchema, xsd) {
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		var refAttr = XsdFile.getAttrValue(node, XsdAttributes.REF);
		// TODO: id

		var propertyName = refAttr; // ref attribute is required for group reference
		var customType = this.namespaceManager.getType(propertyName, jsonSchema, xsd).get$RefToSchema();
		var isArray = (maxOccursAttr !== undefined && (maxOccursAttr > 1 || maxOccursAttr === XsdAttributeValues.UNBOUNDED));
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.EXTENSION:
				throw new Error('group() [reference] needs to be impemented within extension!');
			case XsdElements.RESTRICTION:
				throw new Error('group() [reference] needs to be impemented within restriction!');
			case XsdElements.CHOICE:
				if (isArray) {
					this.addChoicePropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
				} else {
					this.addChoiceProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
				}
				break;
			case XsdElements.COMPLEX_TYPE:
			case XsdElements.SEQUENCE:
			case XsdElements.ALL:
				if (isArray) {
					this.addPropertyAsArray(this.workingJsonSchema, propertyName, customType, minOccursAttr, maxOccursAttr);
				} else {
					this.addProperty(this.workingJsonSchema, propertyName, customType, minOccursAttr);
				}
				break;
			default:
				throw new Error('group() [reference] called from within unexpected parsing state!');
		}
		return true;
	}

	group(node, jsonSchema, xsd) {
		if (XsdFile.isReference(node)) {
			return this.handleGroupReference(node, jsonSchema, xsd);
		} else {
			return this.handleGroupDefinition(node, jsonSchema, xsd);
		}
	}

	import (node, jsonSchema, xsd) {
		// TODO: id, namespace, schemaLocation
		// do nothing
		return true;
	}

	include(node, jsonSchema, xsd) {
		// TODO: id, schemaLocation
		// do nothing
		return true;
	}

	handleKeyConstraint() {
		// TODO: id, name
		// (TBD)
		return true;
	}

	handleKeyReferenceToKeyConstraint() {
		// TODO: id, ref
		// (TBD)
		return true;
	}

	key(node, jsonSchema, xsd) {
		// (TBD)
		return true;
	}

	handleKeyReference(node, jsonSchema, xsd) {
		// TODO: id, name, refer
		// (TBD)
		return true;
	}

	handleKeyReferenceToKeyReference(node, jsonSchema, xsd) {
		// TODO: id, ref
		// (TBD)
		return true;
	}

	keyref(node, jsonSchema, xsd) {
		// (TBD)
		return true;
	}

	length(node, jsonSchema, xsd) {
		// TODO: id, fixed
		var len = XsdFile.getNumberValueAttr(node);

		this.workingJsonSchema.maxLength = len;
		this.workingJsonSchema.minLength = len;
		return true;
	}

	list(node, jsonSchema, xsd) {
		// TODO: id, itemType
		// (TBD)
		return true;
	}

	maxExclusive(node, jsonSchema, xsd) {
		var val = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		this.workingJsonSchema.maximum = val;
		this.workingJsonSchema.exlusiveMaximum = true;
		return true;
	}

	maxInclusive(node, jsonSchema, xsd) {
		var val = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		this.workingJsonSchema.maximum = val; // inclusive is the JSON Schema default
		return true;
	}

	maxLength(node, jsonSchema, xsd) {
		var len = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		var currentProp = this.getCurrentProperty(this.workingJsonSchema, 1)

		if (currentProp && !this.parsingState.isSchemaBeforeState()) {
			if (currentProp.name.toLowerCase().startsWith((LISTOF).toLowerCase())) {
				var childProp = this.getCurrentProperty(currentProp.obj.items, 1)

				childProp.obj.maxLength = len;
				this.addProperty(currentProp.obj.items, childProp.name, childProp.obj, null);
			} else {
				if (currentProp.haveProperties) {
					var childProp = this.getCurrentProperty(currentProp.obj, 1)

					childProp.obj.maxLength = len;
					this.addProperty(currentProp.obj, childProp.name, childProp.obj, null);
				} else {
					currentProp.obj.maxLength = len;
					this.addProperty(this.workingJsonSchema, currentProp.name, currentProp.obj, null);
				}
			}
		} else {
			//	currentProp.obj.maxLength = len;
			this.workingJsonSchema.maxLength = len;
		}


		return true;
	}

	minExclusive(node, jsonSchema, xsd) {
		var val = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		this.workingJsonSchema.minimum = val;
		this.workingJsonSchema.exclusiveMinimum = true;
		return true;
	}

	minInclusive(node, jsonSchema, xsd) {
		var val = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		this.workingJsonSchema.minimum = val; // inclusive is the JSON Schema default
		return true;
	}

	minLength(node, jsonSchema, xsd) {
		var len = XsdFile.getNumberValueAttr(node);
		// TODO: id, fixed

		this.workingJsonSchema.minLength = len;
		return true;
	}

	notation(node, jsonSchema, xsd) {
		// TODO: id, name, public, system
		// (TBD)
		return true;
	}

	openContent(node, jsonSchema, xsd) {
		// TODO: id, mode
		// (TBD)
		return true;
	}

	override(node, jsonSchema, xsd) {
		// TODO: id, schemaLocation
		// (TBD)
		return true;
	}

	pattern(node, jsonSchema, xsd) {
		var pattern = XsdFile.getValueAttr(node);
		// TODO: id

		this.workingJsonSchema.pattern = pattern;
		return true;
	}

	redefine(node, jsonSchema, xsd) {
		// TODO: id, schemaLocation
		// (TBD)
		return true;
	}

	restriction(node, jsonSchema, xsd) {
		let baseAttr = XsdFile.getAttrValue(node, XsdAttributes.BASE);
		let baseType = new Qname(baseAttr);
		let baseTypeName = baseType.getLocal();
		// TODO: id, (base inheritance via allOf)


		if (this.builtInTypeConverter[baseTypeName] === undefined) {
			this.parsingState.pushSchema(this.workingJsonSchema);
			this.workingJsonSchema = this.workingJsonSchema.extend(this.namespaceManager.getType(baseTypeName, jsonSchema, xsd));
			return true;
		} else {
			let currentProp = this.getCurrentProperty(this.workingJsonSchema, 1);


			if (currentProp && !this.parsingState.isSchemaBeforeState()) {
				if (currentProp.name.toLowerCase().startsWith((LISTOF).toLowerCase())) {
					let childProp = this.getCurrentProperty(currentProp.obj.items, 1)

					this.handleRestrictionType(currentProp.obj.items, baseAttr, childProp, xsd);
				} else {
					if (currentProp.haveProperties) {
						let childProp = this.getCurrentProperty(currentProp.obj, 1)

						this.handleRestrictionType(currentProp.obj, baseAttr, childProp, xsd);
					} else {
						this.handleRestrictionType(this.workingJsonSchema, baseAttr, currentProp, xsd);
					}

				}
			} else {
				this.handleRestrictionType(this.workingJsonSchema, baseAttr, null, xsd);
			}

			return true;
		}
	}

	handleRestrictionType(schema, typeName, property, xsd) {
		let restrictiontype = this.namespaceManager.getType(typeName, schema, xsd).get$RefToSchema();
		if (property) {
			// property.obj.type = restrictiontype.type;
			// property.obj.format = restrictiontype.format;
			this.namespaceManager.builtInTypeConverter.transformType(property.obj, restrictiontype);
			this.addProperty(schema, property.name, property.obj, null);
		} else {
			this.namespaceManager.builtInTypeConverter.transformType(schema, restrictiontype);
		}
	}

	transformType(target, source) {

	}

	getCurrentProperty(schema, level) {
		let properties = schema.properties;
		let propNames = Object.keys(properties);

		if (propNames.length > 0) {
			let currentProp = Object.assign(new JsonSchemaFile(), properties[propNames[propNames.length - level]] || properties[propNames[0]]);
			let propName = propNames[propNames.length - level] || propNames[0];

			return {
				obj: currentProp,
				name: propName,
				haveProperties: this.isObjectWithProperties(currentProp.properties)
			};
		}

	}

	schema(node, jsonSchema, xsd) {
		// TODO: id, version, targetNamespace, attributeFormDefualt, elementFormDefualt, blockDefault, finalDefault, xml:lang, defaultAttributes, xpathDefaultNamespace

		jsonSchema.description = 'Schema tag attributes: ' + utils.objectToString(XsdFile.buildAttributeMap(node));
		this.initializeNamespaces(xsd);
		return true;
	}

	selector(node, jsonSchema, xsd) {
		// TODO: key, keyref, unique
		// (TBD)
		return true;
	}

	sequence(node, jsonSchema, xsd) {
		var minOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MIN_OCCURS);
		var maxOccursAttr = XsdFile.getAttrValue(node, XsdAttributes.MAX_OCCURS);
		var isArray = (maxOccursAttr !== undefined && (maxOccursAttr > 1 || maxOccursAttr === XsdAttributeValues.UNBOUNDED));
		// if (isArray) {
		// 	throw new Error('sequence arrays need to be implemented!');
		// }
		var isOptional = (minOccursAttr !== undefined && minOccursAttr == 0);
		if (isOptional === true) {
			const type = XsdFile.getTypeNode(node);
			const typeName = type.getAttribute('name');
			debug('Optional Sequence Found : ' + xsd.baseFilename + ':' + typeName);
			if (typeName == '') {
				this.parsingState.dumpStates(xsd.baseFilename);
				XsdFile.dumpNode(node);
			}
		}
		var state = this.parsingState.getCurrentState();
		switch (state.name) {
			case XsdElements.CHOICE:
				var choiceSchema = new JsonSchemaFile();
				//choiceSchema.additionalProperties = false;
				this.workingJsonSchema.oneOf.push(choiceSchema);
				this.parsingState.pushSchema(this.workingJsonSchema);
				this.workingJsonSchema = choiceSchema;
				break;
			case XsdElements.COMPLEX_TYPE:
				if (isArray) {
					this.workingJsonSchema.type = jsonSchemaTypes.ARRAY;
					this.workingJsonSchema.minItems = minOccursAttr;

					if (maxOccursAttr === XsdAttributeValues.UNBOUNDED || maxOccursAttr === undefined) {
						this.workingJsonSchema.maxItems = undefined
					} else {
						this.workingJsonSchema.maxItems = parseInt(maxOccursAttr);
					}

				}
				break;
			case XsdElements.EXTENSION:
				break;
			case XsdElements.GROUP:
				break;
			case XsdElements.RESTRICTION:
				break;
			case XsdElements.SEQUENCE:
				if (isOptional) {
					var optionalSequenceSchema = new JsonSchemaFile();
					this.workingJsonSchema.anyOf.push(optionalSequenceSchema);
					// Add an the optional part (empty schema)
					var emptySchema = new JsonSchemaFile();
					this.workingJsonSchema.anyOf.push(emptySchema);
					this.parsingState.pushSchema(this.workingJsonSchema);
					this.workingJsonSchema = optionalSequenceSchema;
				} else {
					throw new Error('Required nested sequences need to be implemented!');
				}
				break;
			default:
				throw new Error('sequence() called from within unexpected parsing state! state = [' + state.name + ']');
		}
		return true;
	}

	simpleContent(node, jsonSchema, xsd) {
		// TODO: id
		// Ignore this grouping and continue processing children
		//	this.workingJsonSchema = new JsonSchemaFileV4();

		return true;
	}

	handleSimpleTypeNamedGlobal(node, jsonSchema, xsd) {
		var nameAttr = XsdFile.getAttrValue(node, XsdAttributes.NAME);
		// TODO: id, final

		this.workingJsonSchema = this.namespaceManager.getType(nameAttr, jsonSchema, xsd);
		jsonSchema.addSubSchema(nameAttr, this.workingJsonSchema);
		return true;
	}

	handleSimpleTypeAnonymousLocal(node, jsonSchema, xsd) {
		// TODO: id
		// Ignore this grouping and continue processing children
		return true;
	}

	simpleType(node, jsonSchema, xsd) {
		var continueParsing
		if (XsdFile.isNamed(node)) {
			continueParsing = this.handleSimpleTypeNamedGlobal(node, jsonSchema, xsd);
		} else {
			continueParsing = this.handleSimpleTypeAnonymousLocal(node, jsonSchema, xsd);
		}
		if (this.parsingState.inAttribute()) {
			// need to pop
		}
		return continueParsing;
	}

	text(node, jsonSchema, xsd) {

		if (this.parsingState.inAppInfo()) {
			//this.workingJsonSchema.concatDescription(node.parent().name() + '=' + node.text() + ' ');
		}
		return true;
	}

	totalDigits(node, jsonSchema, xsd) {
		let valueAttr = XsdFile.getAttrValue(node, XsdAttributes.VALUE);

		let currentProp = this.getCurrentProperty(this.workingJsonSchema, 1);

		if (valueAttr) {
			let value = "";
			for (let i = 0; i < valueAttr; i++) {
				value += 9;
			}
			//Caso totalDigits maior que 15 deve-se truncar em 15 digitos para não quebrar o maximum/minimum
			value = value.substr(0,15);
			value = parseInt(value);
			if (currentProp) {


				if (currentProp.haveProperties) {
					let childProp = this.getCurrentProperty(currentProp.obj, 1);
					childProp.obj.maximum = (!isNaN(childProp.obj.maximum)) ? childProp.obj.maximum : value;
					childProp.obj.minimum = (!isNaN(childProp.obj.minimum)) ? childProp.obj.minimum : -value;
					this.addProperty(currentProp.obj, childProp.name, childProp.obj);
				} else {
					currentProp.obj.maximum = (!isNaN(currentProp.obj.maximum)) ? currentProp.obj.maximum : value;
					currentProp.obj.minimum = (!isNaN(currentProp.obj.minimum)) ? currentProp.obj.minimum : -value;
					this.addProperty(this.workingJsonSchema, currentProp.name, currentProp.obj);
				}
			} else {
				this.workingJsonSchema.maximum = (!isNaN(this.workingJsonSchema.maximum)) ? this.workingJsonSchema.maximum : value;
				this.workingJsonSchema.minimum = (!isNaN(this.workingJsonSchema.minimum)) ? this.workingJsonSchema.minimum : -value;
			}
		}



		return true;
	}

	union(node, jsonSchema, xsd) {
		// TODO: id, memberTypes
		// (TBD)
		return true;
	}

	handleUniqueConstraint(node, jsonSchema, xsd) {
		// TODO: id, name
		// (TBD)
		return true;
	}

	handleUniqueReferenceToUniqueConstraint(node, jsonSchema, xsd) {
		// TODO: id, ref
		// (TBD)
		return true;
	}

	unique(node, jsonSchema, xsd) {
		// (TBD)
		return true;
	}

	whitespace(node, jsonSchema, xsd) {
		// TODO: id, value, fixed
		// (TBD)
		return true;
	}

	processSpecialCases() {
		this.specialCaseIdentifier.specialCases.forEach(function (sc, index, array) {
			this.specialCaseIdentifier[sc.specialCase](sc.jsonSchema, sc.node);
		}, this);
	}
}

module.exports = BaseConverter;
